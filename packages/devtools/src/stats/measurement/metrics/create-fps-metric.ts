import type { StatsMetric, StatsReading } from '#types/metric.js';

import { createStatsRange } from '../create-stats-range.js';

const MILLISECONDS_PER_SECOND = 1000;

/** Counts complete frame intervals against real elapsed time, not instantaneous reciprocals. */
export function createFpsMetric(): StatsMetric {
  const range = createStatsRange();
  let intervalCount = 0;
  let totalMilliseconds = 0;

  return { start: noop, stop: noop, measure, collect, reset };

  function measure(deltaMilliseconds: number): void {
    // The initial render establishes timing but is not a complete frame interval.
    if (deltaMilliseconds === 0) {
      return;
    }
    intervalCount += 1;
    totalMilliseconds += deltaMilliseconds;
  }

  /** Lifetime extrema describe published FPS windows, not individual frames. */
  function collect(): StatsReading | undefined {
    if (intervalCount === 0) {
      return undefined;
    }
    const value = (intervalCount * MILLISECONDS_PER_SECOND) / totalMilliseconds;
    range.observe(value);
    reset();
    return { value, graphValue: value, range: range.current };
  }

  function reset(): void {
    intervalCount = 0;
    totalMilliseconds = 0;
  }
}

/** FPS uses supplied frame intervals and owns no external subscriptions. */
function noop(): void {}
