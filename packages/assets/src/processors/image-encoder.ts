import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import sharp from 'sharp';

import { settleAssetTasks } from '#pipeline/settle-asset-tasks.js';
import type { ImageOptions } from '#types/asset-options.js';
import type { ImageEncodingRequest, PreparedImage } from '#types/encoding.js';
import type { GeneratedFile, GeneratedImageFormat } from '#types/processed-assets.js';

import { selectSmallestOutput } from './output-selection.js';

const DEFAULT_IMAGE_QUALITY = {
  avif: 72,
  jpg: 82,
  webp: 80,
} satisfies Record<'avif' | 'jpg' | 'webp', number>;

/**
 * Selects the encodings worth comparing for an image.
 *
 * Lossless assets compare WebP with PNG. Lossy opaque assets can use JPEG,
 * while assets containing transparent pixels use PNG as their alpha-safe
 * conventional fallback. AVIF and WebP are considered in both lossy cases.
 */
export function selectImageCandidateFormats(
  options: ImageOptions,
  image: PreparedImage,
): readonly GeneratedImageFormat[] {
  if (options.lossless) {
    return ['webp', 'png'];
  }

  return image.isOpaque ? ['avif', 'webp', 'jpg'] : ['avif', 'webp', 'png'];
}

/**
 * Scales an image once and inspects the resulting pixels for transparency.
 *
 * The inspection happens after resizing because interpolation can change alpha
 * values near transparent edges. A lossless intermediate guarantees that each
 * candidate encoder receives exactly the same transformed pixels.
 */
export async function prepareImage(
  input: string | Buffer,
  scale: number,
  sourcePath: string,
): Promise<PreparedImage> {
  let image = sharp(input);

  if (scale !== 1) {
    const metadata = await image.metadata();

    if (metadata.width === undefined) {
      throw new Error(`Cannot determine image width for scaling: ${sourcePath}`);
    }

    image = image.resize({ width: Math.max(1, Math.round(metadata.width * scale)) });
  }

  const buffer = await image.png().toBuffer();
  const { isOpaque } = await sharp(buffer).stats();

  return { buffer, isOpaque };
}

/**
 * Writes every applicable image candidate and returns the smallest generated file.
 *
 * Standalone images, atlas sheets, and Spine pages all pass through this same
 * boundary, ensuring that they use identical preparation, encoding, comparison,
 * and cleanup behavior.
 */
export async function writeSmallestImage(
  request: ImageEncodingRequest,
): Promise<GeneratedFile<GeneratedImageFormat>> {
  const prepared = await prepareImage(request.input, request.options.scale, request.sourcePath);
  const candidateFormats = selectImageCandidateFormats(request.options, prepared);
  const outputs = await settleAssetTasks(
    candidateFormats.map(async (format) => {
      const path = `${request.outputBasePath}.${format}`;

      await writeImageVariant(prepared.buffer, path, format, request.options);

      return { format, path };
    }),
  );

  return selectSmallestOutput(outputs);
}

/** Writes one encoded image candidate from a prepared image buffer. */
async function writeImageVariant(
  input: Buffer,
  outputPath: string,
  format: GeneratedImageFormat,
  options: ImageOptions,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });

  let image = sharp(input);
  const quality = options.lossless ? undefined : options.quality;

  switch (format) {
    case 'avif':
      image = image.avif({ quality: quality ?? DEFAULT_IMAGE_QUALITY.avif });
      break;
    case 'jpg':
      image = image.jpeg({ quality: quality ?? DEFAULT_IMAGE_QUALITY.jpg });
      break;
    case 'png':
      image = image.png();
      break;
    case 'webp':
      image = options.lossless
        ? image.webp({ lossless: true })
        : image.webp({ quality: quality ?? DEFAULT_IMAGE_QUALITY.webp });
      break;
  }

  await image.toFile(outputPath);
}
