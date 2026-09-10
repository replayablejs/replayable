import { NineSliceSprite, Texture } from 'pixi.js';

import type { CreateNineSliceSpriteOptions } from '#types/factories.js';

import { applyDisplayObjectOptions } from './apply-display-object-options.js';

/** Creates an unattached nine-slice sprite with explicitly named borders. */
export function createNineSliceSprite(options: CreateNineSliceSpriteOptions): NineSliceSprite {
  const { bottomHeight, height, leftWidth, rightWidth, texture, topHeight, width } = options;
  const sprite = new NineSliceSprite({
    bottomHeight,
    height,
    leftWidth,
    rightWidth,
    texture: typeof texture === 'string' ? Texture.from(texture) : texture,
    topHeight,
    width,
  });

  applyDisplayObjectOptions(sprite, options);

  return sprite;
}
