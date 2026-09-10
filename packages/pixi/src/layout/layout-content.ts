import type { Container } from 'pixi.js';

import type {
  ContentLayout,
  LayoutAlignment,
  LayoutBounds,
  LayoutScaleMode,
  ResolvedLayoutArea,
} from '#types/layout.js';

/**
 * Resolves one content placement without mutating its live Pixi transform.
 *
 * Pixi local bounds may begin away from `(0, 0)`, and pivot moves the object's
 * transform origin independently from those bounds. This calculation first
 * determines the final scale, transforms both local edges around the pivot,
 * and finally derives the position that puts the resulting visual box at the
 * area's requested alignment and pixel offset.
 *
 * Rotation and skew are intentionally excluded. Applications that need those
 * transforms to participate in fitting should attach an untransformed parent
 * container and rotate or skew its child.
 */
export function resolveContentLayout(content: Container, area: ResolvedLayoutArea): ContentLayout {
  const contentBounds = content.getLocalBounds();
  const { scaleX, scaleY } = resolveScale(
    area.scale,
    area.bounds,
    contentBounds,
    content.scale.x,
    content.scale.y,
  );

  // Local bounds exclude the object's own pivot and scale. Transform both
  // edges so preserved negative scale still produces the correct visual box.
  const firstX = (contentBounds.x - content.pivot.x) * scaleX;
  const secondX = (contentBounds.x + contentBounds.width - content.pivot.x) * scaleX;
  const firstY = (contentBounds.y - content.pivot.y) * scaleY;
  const secondY = (contentBounds.y + contentBounds.height - content.pivot.y) * scaleY;
  const minimumX = Math.min(firstX, secondX);
  const minimumY = Math.min(firstY, secondY);
  const contentWidth = Math.abs(secondX - firstX);
  const contentHeight = Math.abs(secondY - firstY);

  return {
    x: resolveAlignedX(area.align, area.bounds, contentWidth) - minimumX + area.offset.x,
    y: resolveAlignedY(area.align, area.bounds, contentHeight) - minimumY + area.offset.y,
    scaleX,
    scaleY,
  };
}

/**
 * Commits a previously resolved placement to Pixi.
 *
 * Resolution is separated from mutation so attach, move, and configuration
 * updates can validate every placement before changing live scene state. Scale
 * is applied before position only for conceptual consistency; both values were
 * fully calculated beforehand and neither setter is expected to fail.
 */
export function applyContentLayout(content: Container, layout: ContentLayout): void {
  content.scale.set(layout.scaleX, layout.scaleY);
  content.position.set(layout.x, layout.y);
}

/**
 * Resolves the final scale for one area's scaling policy.
 *
 * `none` preserves the object's authored scale, including negative values used
 * for flipping. Other modes derive positive scales from unscaled local bounds:
 * `fit` only shrinks, `contain` may shrink or grow while remaining entirely
 * visible, `cover` fills and may crop, and `stretch` scales each axis alone.
 */
function resolveScale(
  mode: LayoutScaleMode,
  area: LayoutBounds,
  content: LayoutBounds,
  currentScaleX: number,
  currentScaleY: number,
): { readonly scaleX: number; readonly scaleY: number } {
  if (mode === 'none') {
    return { scaleX: currentScaleX, scaleY: currentScaleY };
  }

  if (content.width === 0 || content.height === 0) {
    throw new Error(`Cannot apply layout scale mode "${mode}" to zero-sized content.`);
  }

  const widthScale = area.width / content.width;
  const heightScale = area.height / content.height;

  switch (mode) {
    case 'fit': {
      const scale = Math.min(1, widthScale, heightScale);
      return { scaleX: scale, scaleY: scale };
    }
    case 'contain': {
      const scale = Math.min(widthScale, heightScale);
      return { scaleX: scale, scaleY: scale };
    }
    case 'cover': {
      const scale = Math.max(widthScale, heightScale);
      return { scaleX: scale, scaleY: scale };
    }
    case 'stretch':
      return { scaleX: widthScale, scaleY: heightScale };
    default:
      throw new Error('Unknown layout scale mode.');
  }
}

/** Places the scaled visual width against the horizontal component of alignment. */
function resolveAlignedX(
  alignment: LayoutAlignment,
  area: LayoutBounds,
  contentWidth: number,
): number {
  switch (alignment) {
    case 'top-left':
    case 'center-left':
    case 'bottom-left':
      return area.x;
    case 'top-center':
    case 'center':
    case 'bottom-center':
      return area.x + (area.width - contentWidth) / 2;
    case 'top-right':
    case 'center-right':
    case 'bottom-right':
      return area.x + area.width - contentWidth;
    default:
      throw new Error('Unknown layout alignment.');
  }
}

/** Places the scaled visual height against the vertical component of alignment. */
function resolveAlignedY(
  alignment: LayoutAlignment,
  area: LayoutBounds,
  contentHeight: number,
): number {
  switch (alignment) {
    case 'top-left':
    case 'top-center':
    case 'top-right':
      return area.y;
    case 'center-left':
    case 'center':
    case 'center-right':
      return area.y + (area.height - contentHeight) / 2;
    case 'bottom-left':
    case 'bottom-center':
    case 'bottom-right':
      return area.y + area.height - contentHeight;
    default:
      throw new Error('Unknown layout alignment.');
  }
}
