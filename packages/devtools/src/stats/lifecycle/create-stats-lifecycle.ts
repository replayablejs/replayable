import { playable, type PostRenderContext } from '@replayablejs/runtime';

import type { StatsView } from '#types/presentation.js';
import type { StatsSampler } from '#types/sampling.js';
import type { Stats } from '#types/stats.js';

import { failStatsSetup, runStatsCleanup } from './run-stats-cleanup.js';

/**
 * Connects measurement and presentation to Replayable's visibility and updates.
 * Host visibility never overrides manual hide intent. This owns every runtime
 * subscription and releases them together when the stats instance is destroyed.
 */
export function createStatsLifecycle(sampler: StatsSampler, view: StatsView): Stats {
  let hostVisible = playable.state.visible;
  let manuallyVisible = true;
  let destroyed = false;
  let removePostRenderListener: (() => void) | undefined;

  const removeVisibilityListener = playable.on('visibilitychange', handleVisibilityChange);
  try {
    updateVisibility();
  } catch (error) {
    // External instrumentation can fail; do not leave a mounted, half-started view.
    return failStatsSetup(error, destroy);
  }

  return { show, hide, destroy };

  /** Requests stats visibility without overriding the host's visibility state. */
  function show(): void {
    // Visibility intent can remain true after an automatic resume fails.
    // Only an active subscription means there is nothing left to start.
    if (destroyed || removePostRenderListener !== undefined) {
      return;
    }

    manuallyVisible = true;
    try {
      updateVisibility();
    } catch (error) {
      // Restore the caller's previous intent so show() can be retried directly.
      manuallyVisible = false;
      throw error;
    }
  }

  /** Releases stats' frame demand until explicitly shown again. */
  function hide(): void {
    if (destroyed || !manuallyVisible) {
      return;
    }

    manuallyVisible = false;
    updateVisibility();
  }

  /** Permanently releases subscriptions and DOM; later public calls are inert. */
  function destroy(): void {
    if (destroyed) {
      return;
    }

    destroyed = true;
    runStatsCleanup([removeVisibilityListener, stopSampling, () => view.destroy()]);
  }

  /** Applies host visibility without changing the caller's show/hide request. */
  function handleVisibilityChange(visible: boolean): void {
    if (destroyed) {
      return;
    }

    hostVisible = visible;
    updateVisibility();
  }

  /** Ignore callbacks retained in runtime's dispatch snapshot after stopSampling(). */
  function handlePostRender({ timestamp }: PostRenderContext): void {
    if (removePostRenderListener === undefined) {
      return;
    }

    const sample = sampler.update(timestamp);
    if (sample !== undefined) {
      view.update(sample);
    }
  }

  /** Stats run only when both the host and caller permit them. */
  function updateVisibility(): void {
    if (hostVisible && manuallyVisible) {
      startSampling();
    } else {
      stopSampling();
    }
  }

  /** Fresh measurements and history start together; lifetime extrema survive. */
  function startSampling(): void {
    if (removePostRenderListener !== undefined) {
      return;
    }

    try {
      sampler.reset(performance.now());
      // Sources acquire instrumentation only; runtime owns frame scheduling.
      sampler.start();
      view.clearHistory();
      view.show();
      removePostRenderListener = playable.postRender.add(handlePostRender);
    } catch (error) {
      return failStatsSetup(error, stopSampling);
    }
  }

  /** The unsubscribe handle is also the single source of subscription state. */
  function stopSampling(): void {
    const unsubscribe = removePostRenderListener;
    removePostRenderListener = undefined;
    runStatsCleanup([() => unsubscribe?.(), sampler.stop, () => view.hide()]);
  }
}
