import type { AssetLoadContext } from '@replayablejs/runtime';
import type { Texture } from 'pixi.js';
import { Assets } from 'pixi.js';

/** Loads one generated Replayable sprite into Pixi's texture cache. */
export async function loadPixiSprite(context: AssetLoadContext<'sprites'>): Promise<Texture> {
  const { id, source } = context;
  const texture = await Assets.load<Texture>({
    alias: id,
    src: source.src,
  });

  // Asset processing may resize the physical image. Pixi resolution restores
  // its authored logical dimensions without changing the generated bitmap.
  texture.source.resolution = source.scale;
  texture.update();

  return texture;
}
