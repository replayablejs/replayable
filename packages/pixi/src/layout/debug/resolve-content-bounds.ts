import type { Container } from 'pixi.js';

import type { LayoutBounds } from '#types/layout.js';

/**
 * Measures the axis-aligned box produced by Replayable's applied placement.
 * Rotation and skew remain excluded because core layout deliberately fits the
 * attached object's untransformed local bounds.
 *
 * The object has already been laid out when this function runs. Adding its
 * position to both pivot-adjusted, scaled edges therefore reconstructs the
 * exact box used by core placement without adding debug output to core logic.
 * Measuring both edges preserves flipped objects whose scale is negative.
 */
export function resolveContentBounds(content: Container): LayoutBounds {
  const bounds = content.getLocalBounds();
  const firstX = content.x + (bounds.x - content.pivot.x) * content.scale.x;
  const secondX = content.x + (bounds.x + bounds.width - content.pivot.x) * content.scale.x;
  const firstY = content.y + (bounds.y - content.pivot.y) * content.scale.y;
  const secondY = content.y + (bounds.y + bounds.height - content.pivot.y) * content.scale.y;

  return {
    x: Math.min(firstX, secondX),
    y: Math.min(firstY, secondY),
    width: Math.abs(secondX - firstX),
    height: Math.abs(secondY - firstY),
  };
}
