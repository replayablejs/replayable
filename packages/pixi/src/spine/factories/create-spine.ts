import { SkeletonData, Spine } from '@esotericsoftware/spine-pixi-v8';
import { playable } from '@replayablejs/runtime';
import { Ticker } from 'pixi.js';

import { applyContainerOptions } from '#factories/apply-container-options.js';
import type { CreateSpineOptions } from '#types/spine.js';

const DEFAULT_MIX_SECONDS = 0.2;

/** Creates an unattached Spine display object from a loaded Replayable asset ID. */
export function createSpine(options: CreateSpineOptions): Spine {
  const skeletonData = resolveSkeletonData(options.skeleton);
  const spine = new Spine({
    // createPixi disables this ticker's own RAF and advances it from
    // playable.update. Spine therefore shares Replayable's frame lifecycle,
    // while Spine.destroy() performs the corresponding listener cleanup.
    autoUpdate: true,
    skeletonData,
    ticker: Ticker.shared,
  });

  applyContainerOptions(spine, options);
  spine.state.data.defaultMix = options.defaultMix ?? DEFAULT_MIX_SECONDS;
  spine.state.timeScale = options.speed ?? 1;

  return spine;
}

/** Keeps runtime cache access and validation out of playable application code. */
function resolveSkeletonData(id: string): SkeletonData {
  const skeletonData = playable.loader.cache.spines?.[id];

  if (!(skeletonData instanceof SkeletonData)) {
    throw new Error(`Spine asset "${id}" has not been loaded.`);
  }

  return skeletonData;
}
