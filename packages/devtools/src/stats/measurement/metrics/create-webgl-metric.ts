import type { StatsMetric, StatsReading } from '#types/metric.js';
import type { StatsWebglCounts } from '#types/webgl.js';

import { collectWebglFrame, subscribeWebglFrames } from '../../webgl/subscribe-webgl-frames.js';
import { createStatsRange } from '../create-stats-range.js';

/** One counter's frame average, graph peak, and lifetime per-frame extrema. */
export function createWebglMetric(key: keyof StatsWebglCounts): StatsMetric {
  const range = createStatsRange();
  let unsubscribeFromFrames: (() => void) | undefined;
  let frames = 0;
  let total = 0;
  let peak = 0;

  return { start, stop, measure, collect, reset };

  /** The source collects once per frame even when all three metrics subscribe. */
  function start(): void {
    unsubscribeFromFrames ??= subscribeWebglFrames(recordFrame);
  }

  /** Releases frame sampling and clears this metric's subscription state. */
  function stop(): void {
    const unsubscribe = unsubscribeFromFrames;

    // Clear ownership before invoking cleanup. Cleanup may throw or re-enter
    // stop(); neither case should leave a stale handle or unsubscribe twice.
    // A later start() can then acquire a fresh subscription.
    unsubscribeFromFrames = undefined;

    unsubscribe?.();
  }

  /** All metrics use the same post-render measurement path; the source deduplicates frames. */
  function measure(_deltaMilliseconds: number, frameTimestamp: number): void {
    collectWebglFrame(frameTimestamp);
  }

  /** A missing/lost context invalidates this window rather than publishing stale work. */
  function recordFrame(_timestamp: number, counts: StatsWebglCounts | undefined): void {
    if (counts === undefined) {
      reset();
      return;
    }
    const count = counts[key];
    frames += 1;
    total += count;
    peak = Math.max(peak, count);
    range.observe(count);
  }

  /** Average includes idle zero-work frames; graph and extrema retain individual peaks. */
  function collect(): StatsReading | undefined {
    if (frames === 0) {
      return undefined;
    }
    const reading = { value: total / frames, graphValue: peak, range: range.current };
    reset();
    return reading;
  }

  /** Discard partial counts without clearing the metric's lifetime range. */
  function reset(): void {
    frames = 0;
    total = 0;
    peak = 0;
  }
}
