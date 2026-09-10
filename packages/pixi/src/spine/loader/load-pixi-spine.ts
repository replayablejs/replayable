import {
  AtlasAttachmentLoader,
  SkeletonBinary,
  type SkeletonData,
  SkeletonJson,
  SpineTexture,
  TextureAtlas,
} from '@esotericsoftware/spine-pixi-v8';
import type { AssetLoadContext } from '@replayablejs/runtime';
import { Assets, type Texture } from 'pixi.js';

import type { LoadedSkeleton } from '#types/spine.js';

/**
 * Loads one generated Spine asset and returns the skeleton data cached by runtime.
 * Atlas text, page images, and skeleton data load concurrently. Once available,
 * pages are bound to Pixi textures before Spine parses attachments. Instances made
 * by createSpine share this data; each instance owns its own animation state.
 */
export async function loadPixiSpine(context: AssetLoadContext<'spines'>): Promise<SkeletonData> {
  const { id, source } = context;

  try {
    const [atlasSource, textures, skeletonSource] = await Promise.all([
      loadAtlasSource(context),
      loadAtlasTextures(source),
      loadSkeletonSource(context),
    ]);
    const atlas = new TextureAtlas(atlasSource);

    bindAtlasTextures(id, atlas, textures);

    const attachmentLoader = new AtlasAttachmentLoader(atlas);

    if (skeletonSource.format === 'json') {
      return new SkeletonJson(attachmentLoader).readSkeletonData(skeletonSource.data);
    }

    return new SkeletonBinary(attachmentLoader).readSkeletonData(skeletonSource.data);
  } catch (cause) {
    throw new Error(`Failed to load Replayable Spine asset "${id}".`, { cause });
  }
}

/** Inline mode carries atlas text directly; resource mode carries its fetchable URL. */
async function loadAtlasSource(context: AssetLoadContext<'spines'>): Promise<string> {
  if (context.assetMode === 'inline') {
    return context.source.atlas;
  }

  const response = await fetchResource(context.source.atlas, 'atlas');

  return response.text();
}

/**
 * Resolves the generated representation into the input expected by Spine's parser.
 * JSON may already be an object. Binary skeletons always arrive through a URL,
 * including a data URL in inline exports. Embedded bytes are decoded locally;
 * only external resource URLs go through fetch.
 */
async function loadSkeletonSource(context: AssetLoadContext<'spines'>): Promise<LoadedSkeleton> {
  const { format, skel } = context.source;

  if (format === 'json') {
    if (typeof skel !== 'string') {
      return { data: skel, format };
    }

    const response = await fetchResource(skel, 'JSON skeleton');

    return { data: await response.json(), format };
  }

  if (typeof skel !== 'string') {
    throw new Error('A binary Spine skeleton must be emitted as a resource URL.');
  }

  if (skel.startsWith('data:')) {
    return { data: decodeInlineSkeleton(skel), format };
  }

  const response = await fetchResource(skel, 'binary skeleton');

  return { data: new Uint8Array(await response.arrayBuffer()), format };
}

/**
 * Decodes the Base64 data URL emitted by the asset pipeline without a request.
 * Meta's connect-src policy blocks fetch(data:...) even though the bytes are
 * already embedded. atob preserves binary byte values, including zero and 255.
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/connect-src
 */
function decodeInlineSkeleton(source: string): Uint8Array {
  const separator = source.indexOf(',');
  if (separator === -1 || !source.slice(0, separator).endsWith(';base64')) {
    throw new Error('An inline binary Spine skeleton must be a Base64 data URL.');
  }

  const binary = atob(source.slice(separator + 1));

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** Loads cached Pixi textures in the atlas page order preserved by asset generation. */
async function loadAtlasTextures(
  source: AssetLoadContext<'spines'>['source'],
): Promise<readonly Texture[]> {
  return Promise.all(
    source.images.map(async (image) => {
      const texture = await Assets.load<Texture>(image);

      // Generated atlas pages may use smaller physical bitmaps. Resolution
      // restores their authored logical size without changing atlas UVs.
      texture.source.resolution = source.scale;
      texture.update();

      return texture;
    }),
  );
}

/**
 * Pairs atlas pages with generated images by index, after checking their counts.
 * SpineTexture adapts Pixi's texture source for attachment UVs and page sampling;
 * it does not create another browser image loader.
 */
function bindAtlasTextures(id: string, atlas: TextureAtlas, textures: readonly Texture[]): void {
  if (atlas.pages.length !== textures.length) {
    throw new Error(
      `Spine asset "${id}" contains ${atlas.pages.length} atlas pages but provides ${textures.length} images.`,
    );
  }

  for (const [index, page] of atlas.pages.entries()) {
    const texture = textures[index];

    if (texture === undefined) {
      throw new Error(`Spine asset "${id}" is missing atlas image ${index}.`);
    }

    page.setTexture(SpineTexture.from(texture.source));
  }
}

/** Rejects HTTP failures with the resource kind and URL before attempting to parse it. */
async function fetchResource(source: string, description: string): Promise<Response> {
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Failed to fetch Spine ${description} "${source}" (${response.status}).`);
  }

  return response;
}
