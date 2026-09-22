import type { AssetLoadContext } from '@replayablejs/runtime';
import { TextureLoader } from 'three';
import type { Texture } from 'three';

/**
 * Loads a standalone image into the runtime's textures cache.
 *
 * The playable owns the returned texture and disposes it when no materials use it.
 * Color space, wrapping, filtering, and UV orientation depend on its material role,
 * so the loader preserves Three.js defaults. For example, a base-color image needs
 * SRGBColorSpace, while a normal map keeps NoColorSpace.
 *
 * Generated image scale changes pixel resolution, not normalized UV coordinates;
 * there is no Pixi-style logical-size correction to apply here. Textures embedded
 * in GLBs are loaded and configured separately by GLTFLoader.
 */
export async function loadThreeTexture({
  id,
  source,
}: AssetLoadContext<'textures'>): Promise<Texture> {
  try {
    return await new TextureLoader().loadAsync(source.src);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Cannot load texture "${id}": ${message}`, { cause });
  }
}
