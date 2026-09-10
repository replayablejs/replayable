import { animate, type TweenPlaybackControls } from '@replayablejs/tween';
import { type Filter, type Sprite } from 'pixi.js';

import type {
  BackgroundDissolve,
  BackgroundTransition,
  DissolveProgress,
} from '../../types/background';
import { createDissolveFilter } from './create-dissolve-filter';
import { createDissolveProgress } from './create-dissolve-progress';

/** Runs the outgoing sprite's dissolve and owns its midpoint, resizing, and cancellation. */
export function createBackgroundDissolve(background: Sprite): BackgroundDissolve {
  let backgroundTransition: BackgroundTransition | undefined;
  let dissolveProgress: DissolveProgress | undefined;
  let filter: Filter | undefined;
  let animation: TweenPlaybackControls | undefined;
  let destroyed = false;

  return { start, destroy };

  /** Starts once; callers await the midpoint while the full dissolve continues. */
  function start(): BackgroundTransition {
    // Check destruction before returning a result from an earlier start.
    if (destroyed) {
      throw new DOMException('Background was destroyed.', 'AbortError');
    }
    if (backgroundTransition !== undefined) {
      return backgroundTransition;
    }

    // Prepare the effect and the midpoint callers will await.
    const dissolveFilter = createDissolveFilter();
    dissolveProgress = createDissolveProgress();
    backgroundTransition = { midpoint: dissolveProgress.midpoint };
    filter = dissolveFilter.filter;

    // Filter only the outgoing sprite, never the shared layout and its endcard.
    background.filters = [filter];
    animation = animate(
      dissolveFilter.uniforms,
      { uProgress: [0, 1] },
      {
        duration: 0.6,
        ease: 'linear',
        onUpdate: () => dissolveProgress?.update(dissolveFilter.uniforms.uProgress),
        onComplete: finish,
      },
    );

    return backgroundTransition;
  }

  /** Hide the outgoing sprite and release its filter after successful completion. */
  function finish(): void {
    // A skipped frame can jump directly to completion without an intermediate update.
    dissolveProgress?.update(1);
    background.visible = false;
    background.filters = [];
    filter?.destroy();
    filter = undefined;
  }

  /** Reject a pending midpoint and stop callbacks before the owner destroys the sprite. */
  function destroy(): void {
    destroyed = true;
    dissolveProgress?.cancel();
    animation?.stop();
    background.filters = [];
    filter?.destroy();
    filter = undefined;
  }
}
