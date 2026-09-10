import type { LayoutConfig } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';

/** Keeps the rating panel above its CTA within the scene's safe content rectangle. */
export function createEndCardLayoutConfig(): LayoutConfig {
  const { safeArea: bounds, orientation } = playable.screen;
  const areas = orientation === 'portrait' ? createPortraitAreas() : createLandscapeAreas();

  return { debug: false, bounds, areas };
}

/** Portrait stacks the popup and CTA beneath the separate branding area. */
function createPortraitAreas(): LayoutConfig['areas'] {
  return {
    rating: {
      bounds: { x: 0.03, y: 0.12, width: 0.94, height: 0.48 },
      align: 'bottom-center',
      scale: 'contain',
    },
    button: {
      bounds: { x: 0.15, y: 0.65, width: 0.7, height: 0.13 },
      align: 'top-center',
      scale: 'contain',
    },
  };
}

/** Landscape reserves the left third for branding and places the popup/CTA to its right. */
function createLandscapeAreas(): LayoutConfig['areas'] {
  return {
    rating: {
      bounds: { x: 2 / 3 - 0.28, y: 0.06, width: 0.56, height: 0.6 },
      align: 'bottom-center',
      scale: 'contain',
    },
    button: {
      bounds: { x: 2 / 3 - 0.18, y: 0.73, width: 0.36, height: 0.2 },
      align: 'top-center',
      scale: 'contain',
    },
  };
}
