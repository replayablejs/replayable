import { Sprite, Texture } from 'pixi.js';

import type { CreateSpriteOptions } from '#types/factories.js';

import { applyDisplayObjectOptions } from './apply-display-object-options.js';

/** Creates an unattached Pixi sprite with Replayable's conventional defaults. */
export function createSprite(options: CreateSpriteOptions = {}): Sprite {
  const sprite = Sprite.from(options.texture ?? Texture.EMPTY);

  applyDisplayObjectOptions(sprite, options);

  if (options.tint !== undefined) {
    sprite.tint = options.tint;
  }

  if (options.eventMode !== undefined) {
    sprite.eventMode = options.eventMode;
  }

  return sprite;
}
