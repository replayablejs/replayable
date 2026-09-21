import type { Document, Texture } from '@gltf-transform/core';
import { EXTTextureAVIF, EXTTextureWebP } from '@gltf-transform/extensions';
import { listTextureSlots } from '@gltf-transform/functions';

import type { ImageOptions } from '#types/asset-options.js';
import type { ModelTextureCandidate } from '#types/encoding.js';
import type { GeneratedImageFormat } from '#types/processed-assets.js';

import { encodeImageVariant, prepareImage, selectImageCandidateFormats } from './image-encoder.js';

/** Material slots whose images represent colors rather than numeric surface data. */
const COLOR_SLOTS = new Set([
  'baseColorTexture',
  'emissiveTexture',
  'diffuseTexture',
  'specularColorTexture',
  'sheenColorTexture',
]);

/** Raster formats understood by the shared image encoder and their glTF MIME types. */
const MIME_TYPES: Record<GeneratedImageFormat, string> = {
  avif: 'image/avif',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/**
 * Optimizes a model's embedded images in place without changing its UV layout.
 *
 * Unlike sprite processing, model textures keep their full image bounds: trimming
 * would change how authored UV coordinates address the image. Color-only textures
 * use the requested image options. Textures used as numeric data, in unknown
 * slots, or in both color and data slots follow the more conservative data policy.
 *
 * For example, with `{ lossless: false, quality: 70, scale: 1 }`:
 *
 * - A base-color image competes against supported encoded candidates by byte size.
 * - A normal or metallic/roughness map keeps its original bytes unchanged.
 * - An image shared by base-color and normal slots also keeps its original bytes.
 *
 * Resized data maps use PNG rather than lossy color encoding. Unsupported source
 * formats such as KTX2 pass through only when no resize or lossy encoding is
 * requested. This processor does not transcode GPU texture formats.
 *
 * Textures are processed sequentially to limit simultaneous decoded image memory;
 * encoding candidates for each image are produced concurrently. Once processing
 * finishes, WebP and AVIF extension requirements are rebuilt from the final MIME
 * types so serialization advertises the image formats actually present.
 *
 * @param document - Decoded model document; textures and image extensions are mutated.
 * @param options - Validated embedded-image options from the selected model rule.
 * @returns Resolves after all texture updates and extension requirements are applied.
 * @throws If an unsupported format needs transformation or image processing fails.
 * Earlier mutations are not rolled back here; the model processor abandons the
 * document and the surrounding build pipeline handles staging cleanup.
 */
export async function processModelTextures(
  document: Document,
  options: ImageOptions,
): Promise<void> {
  for (const texture of document.getRoot().listTextures()) {
    await processTexture(texture, options);
  }

  updateImageExtensions(document);
}

/**
 * Applies the format and material-usage policies to one texture.
 *
 * Missing image payloads are left untouched. Unsupported image formats are
 * validated before inspecting material slots, preserving the same pass-through
 * restriction for both color and data maps. Unscaled data maps bypass decoding
 * entirely, including preservation of RGB values beneath transparent alpha.
 */
async function processTexture(texture: Texture, options: ImageOptions): Promise<void> {
  const image = texture.getImage();
  if (image === null || !canEncodeTexture(texture, options)) {
    return;
  }

  const colorOnly = usesOnlyColorSlots(texture);
  if (!colorOnly && options.scale === 1) {
    return;
  }

  const encoding: ImageOptions = colorOnly ? options : { lossless: true, scale: options.scale };
  const selected = await encodeTexture(texture, image, encoding, colorOnly);

  // The image now belongs to the document; discard its old external filename.
  texture.setImage(selected.image).setMimeType(selected.mimeType).setURI('');
}

/**
 * Identifies images the raster encoder can process and validates other formats.
 *
 * Returning false means an unsupported image may pass through unchanged. A
 * requested resize or lossy encode must fail rather than silently ignore options.
 * This policy permits existing KTX2 payloads without pretending to encode them.
 */
function canEncodeTexture(texture: Texture, options: ImageOptions): boolean {
  if (Object.values(MIME_TYPES).includes(texture.getMimeType())) {
    return true;
  }

  if (options.scale !== 1 || !options.lossless) {
    throw new Error(
      `Cannot resize or re-encode model texture ${texture.getName()}: ${texture.getMimeType()}. Supply PNG, JPEG, WebP, or AVIF images.`,
    );
  }

  return false;
}

/**
 * Requires every usage to be a known color slot before allowing color compression.
 *
 * A texture can be shared across several materials and slot types. Any data or
 * unknown usage takes precedence over color usage. An unreferenced texture is
 * also treated conservatively because its intended semantics are unknown.
 */
function usesOnlyColorSlots(texture: Texture): boolean {
  const slots = listTextureSlots(texture);
  return slots.length > 0 && slots.every((slot) => COLOR_SLOTS.has(slot));
}

/**
 * Prepares one full-size image canvas and selects its smallest allowed encoding.
 *
 * Color candidates use the shared image encoder's alpha and lossless policies,
 * but exclude newly generated AVIF: model optimization should not introduce that
 * loader requirement merely to save bytes. Data maps have only a PNG candidate.
 * Existing AVIF remains eligible as the original-image candidate when unscaled.
 *
 * The original bytes compete only at scale 1, so requested dimensions cannot be
 * bypassed by choosing a smaller source file. Consequently, quality is an encoder
 * setting, not a guarantee that the source format or bytes will change. Equal-size
 * candidates retain insertion order, with the original considered last.
 */
async function encodeTexture(
  texture: Texture,
  image: Uint8Array,
  options: ImageOptions,
  colorOnly: boolean,
): Promise<ModelTextureCandidate> {
  const prepared = await prepareImage(Buffer.from(image), options.scale, texture.getName());
  const formats: readonly GeneratedImageFormat[] = colorOnly
    ? selectImageCandidateFormats(options, prepared).filter((format) => format !== 'avif')
    : ['png'];
  const candidates: ModelTextureCandidate[] = await Promise.all(
    formats.map(async (format) => ({
      image: await encodeImageVariant(prepared.buffer, format, options),
      mimeType: MIME_TYPES[format],
    })),
  );

  if (options.scale === 1) {
    candidates.push({ image: Buffer.from(image), mimeType: texture.getMimeType() });
  }

  candidates.sort((a, b) => a.image.byteLength - b.image.byteLength);
  const selected = candidates[0];
  if (selected === undefined) {
    throw new Error('No model texture encoding candidates.');
  }

  return selected;
}

/**
 * Rebuilds WebP and AVIF requirements from the document's final texture formats.
 *
 * A source WebP image may become PNG, or a PNG may become WebP. Keeping stale
 * declarations could demand an unused extension or omit a required one. Remove
 * only these two image extensions, then mark each surviving format as required:
 * the selected texture has no separate core-format fallback. Other extensions,
 * including those supporting untouched KTX2 textures, remain unchanged.
 */
function updateImageExtensions(document: Document): void {
  const root = document.getRoot();

  for (const extension of root.listExtensionsUsed()) {
    if (
      extension.extensionName === EXTTextureWebP.EXTENSION_NAME ||
      extension.extensionName === EXTTextureAVIF.EXTENSION_NAME
    ) {
      extension.dispose();
    }
  }

  const mimeTypes = new Set(root.listTextures().map((texture) => texture.getMimeType()));
  if (mimeTypes.has('image/webp')) {
    document.createExtension(EXTTextureWebP).setRequired(true);
  }
  if (mimeTypes.has('image/avif')) {
    document.createExtension(EXTTextureAVIF).setRequired(true);
  }
}
