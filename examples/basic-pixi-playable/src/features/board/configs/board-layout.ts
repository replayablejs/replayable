import type { LayoutConfig } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';

/** Two centered columns, with a small explicit gap in landscape. */
export function createBoardLayoutConfig(): LayoutConfig {
  const { orientation } = playable.screen;
  const bounds = { x: 0, y: 0, width: 1000, height: 800 };
  const areas = orientation === 'portrait' ? createPortraitAreas() : createLandscapeAreas();

  return { debug: false, bounds, areas };
}

/** Equal full-height slots use all available portrait width. */
function createPortraitAreas(): LayoutConfig['areas'] {
  return {
    left: { bounds: { x: 0, y: 0, width: 0.5, height: 1 }, scale: 'contain' },
    right: { bounds: { x: 0.5, y: 0, width: 0.5, height: 1 }, scale: 'contain' },
  };
}

/** Full-height slots avoid spending the limited landscape height on internal padding. */
function createLandscapeAreas(): LayoutConfig['areas'] {
  return {
    left: {
      bounds: { x: 0, y: 0, width: 0.49, height: 1 },
      scale: 'contain',
    },
    right: {
      bounds: { x: 0.51, y: 0, width: 0.49, height: 1 },
      scale: 'contain',
    },
  };
}
