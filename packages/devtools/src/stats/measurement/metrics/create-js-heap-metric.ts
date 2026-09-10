import type { StatsMetric, StatsReading } from '#types/metric.js';

import { createStatsRange } from '../create-stats-range.js';

const BYTES_PER_MEGABYTE = 1_000_000;

/** Reads browser memory only on refresh; it has no per-frame or partial-window work. */
export function createJsHeapMetric(): StatsMetric {
  const range = createStatsRange();
  return { start: noop, stop: noop, measure: noop, reset: noop, collect };

  function collect(): StatsReading | undefined {
    const value = readJsHeap();
    if (value === undefined) {
      return undefined;
    }
    range.observe(value);
    return { value, graphValue: value, range: range.current };
  }
}

/**
 * Reads the optional browser heap estimate only on collection.
 * This is not total playable memory: it excludes GPU allocations and may
 * include other work sharing the browser's JavaScript heap.
 */
function readJsHeap(): number | undefined {
  if (!('memory' in performance)) {
    return undefined;
  }

  const { memory } = performance;

  if (typeof memory !== 'object' || memory === null || !('usedJSHeapSize' in memory)) {
    return undefined;
  }

  const bytes = memory.usedJSHeapSize;

  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
    return undefined;
  }

  return bytes / BYTES_PER_MEGABYTE;
}

/** Heap observations need no subscriptions, frame accumulation, or window reset. */
function noop(): void {}
