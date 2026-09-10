import type { LayoutConfig } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';

/** Background covers the complete runtime frame independently of content margins. */
export function createBackgroundLayoutConfig(): LayoutConfig {
  const bounds = playable.screen.frame;
  return {
    debug: false,
    bounds: { x: 0, y: 0, width: bounds.width, height: bounds.height },
    areas: {
      background: { bounds: { x: 0, y: 0, width: 1, height: 1 }, scale: 'cover' },
    },
  };
}
