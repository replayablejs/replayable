import { AnimatedSprite, Texture } from 'pixi.js';

import type { CreateAnimatedSpriteOptions } from '#types/factories.js';

import { applyDisplayObjectOptions } from './apply-display-object-options.js';

/** Creates an unattached animated sprite driven by Pixi's Replayable-managed ticker. */
export function createAnimatedSprite(options: CreateAnimatedSpriteOptions): AnimatedSprite {
  const { animationSpeed = 1, autoPlay = false, frames, loop = false } = options;

  if (frames.length === 0) {
    throw new Error('Cannot create an animated sprite without texture frames.');
  }

  const textures = frames.map((frame) => (typeof frame === 'string' ? Texture.from(frame) : frame));
  const sprite = new AnimatedSprite(textures);

  applyDisplayObjectOptions(sprite, options);
  sprite.animationSpeed = animationSpeed;
  sprite.loop = loop;

  if (autoPlay) {
    sprite.play();
  }

  return sprite;
}
