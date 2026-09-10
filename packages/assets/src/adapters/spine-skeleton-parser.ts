import { readFile } from 'node:fs/promises';

import {
  AtlasAttachmentLoader,
  type SkeletonData,
  SkeletonBinary,
  SkeletonJson,
  TextureAtlas,
} from '@esotericsoftware/spine-core';

import type { SpineSkeletonSource, SpineSkeletonMetadata } from '#types/adapters.js';

/**
 * Parses one authored Spine skeleton with the official runtime readers.
 *
 * Both JSON and binary SKEL readers require an `AtlasAttachmentLoader` while
 * resolving skeleton attachments. The companion `.atlas` file is therefore
 * parsed even though Replayable retains only animation and skin names. Texture
 * image pixels are not required for this metadata operation.
 *
 * Names remain in the order supplied by Spine. Registry generation owns
 * deduplication and alphabetical ordering because those are serialization
 * concerns rather than properties of the authored skeleton.
 *
 * The temporary `TextureAtlas` owns runtime objects and is always disposed
 * after skeleton parsing, whether parsing succeeds or throws.
 *
 * @param skeleton - Authored JSON or SKEL skeleton path and resolved format.
 * @param atlasPath - Absolute path of the companion authored `.atlas` file.
 * @returns Animation and skin names needed by the generated Spine registry.
 * @throws A source-specific error when the atlas or skeleton cannot be parsed.
 */
export async function readSpineSkeletonMetadata(
  skeleton: SpineSkeletonSource,
  atlasPath: string,
): Promise<SpineSkeletonMetadata> {
  const textureAtlas = await readTextureAtlas(atlasPath);

  try {
    const attachmentLoader = new AtlasAttachmentLoader(textureAtlas);
    const skeletonData = await readSkeletonData(skeleton, attachmentLoader);

    return {
      animationNames: skeletonData.animations.map((animation) => animation.name),
      skinNames: skeletonData.skins.map((skin) => skin.name),
    };
  } finally {
    textureAtlas.dispose();
  }
}

/** Reads and parses the companion atlas used to resolve skeleton attachments. */
async function readTextureAtlas(atlasPath: string): Promise<TextureAtlas> {
  const source = await readFile(atlasPath, 'utf8');

  try {
    return new TextureAtlas(source);
  } catch (cause) {
    throw new Error(`Invalid Spine atlas: ${atlasPath}`, { cause });
  }
}

/** Selects the official JSON or binary reader for the resolved source format. */
async function readSkeletonData(
  skeleton: SpineSkeletonSource,
  attachmentLoader: AtlasAttachmentLoader,
): Promise<SkeletonData> {
  try {
    switch (skeleton.format) {
      case 'json': {
        const source = await readFile(skeleton.path, 'utf8');

        return new SkeletonJson(attachmentLoader).readSkeletonData(JSON.parse(source));
      }
      case 'skel': {
        const source = await readFile(skeleton.path);

        return new SkeletonBinary(attachmentLoader).readSkeletonData(new Uint8Array(source));
      }
      default:
        return skeleton.format satisfies never;
    }
  } catch (cause) {
    throw new Error(`Invalid Spine ${skeleton.format.toUpperCase()} skeleton: ${skeleton.path}`, {
      cause,
    });
  }
}
