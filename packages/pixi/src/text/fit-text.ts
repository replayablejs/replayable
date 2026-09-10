import type { SplitText, Text } from 'pixi.js';

import type { FitTextOptions } from '#types/text.js';

/**
 * Uniformly fits text inside a box without enlarging beyond its authored size.
 * Replaces the object's scale using local bounds, so repeated fitting never
 * compounds a previous fit. Position, pivot, wrapping, and text remain unchanged.
 * Split manually managed SplitText before fitting, and fit before animating its
 * characters (or supply stable boundsArea). Empty bounds impose no constraint.
 */
export function fitText(text: Text | SplitText, options: FitTextOptions): void {
  const { width, height } = options;
  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    (height !== undefined && (!Number.isFinite(height) || height <= 0))
  ) {
    throw new Error('Text fitting dimensions must be positive finite numbers.');
  }

  const bounds = text.getLocalBounds();
  const widthScale = bounds.width > 0 ? width / bounds.width : 1;
  const heightScale = height !== undefined && bounds.height > 0 ? height / bounds.height : 1;
  text.scale.set(Math.min(1, widthScale, heightScale));
}
