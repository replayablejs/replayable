import type {
  StatsWebglContext,
  StatsWebglContextSampling,
  StatsWebglCounts,
  StatsWebglTracker,
} from '#types/webgl.js';

import { failStatsSetup, runStatsCleanup } from '../lifecycle/run-stats-cleanup.js';
import { createWebglTracker } from './create-webgl-tracker.js';

/** Owns instrumentation and loss listeners for one registered, renderer-created context. */
export function createWebglContextSampling(context: StatsWebglContext): StatsWebglContextSampling {
  let tracker: StatsWebglTracker | undefined;
  let destroyed = false;

  try {
    context.canvas.addEventListener('webglcontextlost', handleContextLost);
    context.canvas.addEventListener('webglcontextrestored', handleContextRestored);
    handleContextRestored();
  } catch (error) {
    return failStatsSetup(error, destroy);
  }

  return { collect, destroy };

  /** Lost contexts are unavailable, not zero-work frames. */
  function collect(): StatsWebglCounts | undefined {
    return tracker?.collect();
  }

  /** Leave preventDefault/restoration policy to the renderer; discard partial counts. */
  function handleContextLost(): void {
    const previousTracker = tracker;
    tracker = undefined;
    previousTracker?.destroy();
  }

  /** Reacquire extension objects and wrappers after restoration, with fresh counters. */
  function handleContextRestored(): void {
    if (!destroyed && tracker === undefined && !context.isContextLost()) {
      tracker = createWebglTracker(context);
    }
  }

  /** Removes listeners before releasing wrappers; does not destroy the canvas or GL context. */
  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;
    runStatsCleanup([
      () => context.canvas.removeEventListener('webglcontextlost', handleContextLost),
      () => context.canvas.removeEventListener('webglcontextrestored', handleContextRestored),
      handleContextLost,
    ]);
  }
}
