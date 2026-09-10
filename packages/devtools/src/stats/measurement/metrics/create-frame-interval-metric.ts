import type { StatsMetric, StatsReading } from '#types/metric.js';

import { createStatsRange } from '../create-stats-range.js';

/** Displays the average, graphs the peak, and retains extrema of individual intervals. */
export function createFrameIntervalMetric(): StatsMetric {
  const range = createStatsRange();
  let intervalCount = 0;
  let totalMilliseconds = 0;
  let peakMilliseconds = 0;

  return { start: noop, stop: noop, measure, collect, reset };

  function measure(deltaMilliseconds: number): void {
    // Do not put the initial timing baseline into averages or lifetime extrema.
    if (deltaMilliseconds === 0) {
      return;
    }
    intervalCount += 1;
    totalMilliseconds += deltaMilliseconds;
    peakMilliseconds = Math.max(peakMilliseconds, deltaMilliseconds);
    // Include every real interval, even if hiding later discards this partial window.
    range.observe(deltaMilliseconds);
  }

  function collect(): StatsReading | undefined {
    if (intervalCount === 0) {
      return undefined;
    }
    const reading = {
      value: totalMilliseconds / intervalCount,
      graphValue: peakMilliseconds,
      range: range.current,
    };
    reset();
    return reading;
  }

  function reset(): void {
    intervalCount = 0;
    totalMilliseconds = 0;
    peakMilliseconds = 0;
  }
}

/** Frame intervals are supplied by runtime; no external resources need acquisition. */
function noop(): void {}
