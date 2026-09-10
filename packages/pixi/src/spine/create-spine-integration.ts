import { playable } from '@replayablejs/runtime';

import { loadPixiSpine } from '#spine/loader/load-pixi-spine.js';
import type { PixiIntegration } from '#types/pixi.js';

/** Creates the optional Pixi capability responsible for Replayable Spine assets. */
export function createSpineIntegration(): PixiIntegration {
  return {
    setup(): () => void {
      return playable.loader.register('spines', loadPixiSpine);
    },
  };
}
