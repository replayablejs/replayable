import type { StatsMetricDefinition } from '#types/metric.js';
import type { StatsSample, StatsSampler } from '#types/sampling.js';

import { createStatsMetrics } from './create-stats-metrics.js';
import { createStatsSamplingClock } from './create-stats-sampling-clock.js';

/** Dispatches real frame intervals to enabled metrics and collects them twice per second. */
export function createStatsSampler(definitions: readonly StatsMetricDefinition[]): StatsSampler {
  const metrics = createStatsMetrics(definitions);
  const clock = createStatsSamplingClock();

  return { start: metrics.start, stop: metrics.stop, reset, update };

  /** Discards partial measurements and excludes the visibility gap, preserving extrema. */
  function reset(timestamp: number): void {
    clock.reset(timestamp);

    metrics.reset();
  }

  /** The clock delivers this frame's interval before permitting metric collection. */
  function update(timestamp: number): StatsSample | undefined {
    const refresh = clock.advance(timestamp, (deltaMilliseconds) => {
      metrics.measure(deltaMilliseconds, timestamp);
    });
    if (!refresh) {
      return undefined;
    }

    return metrics.collect();
  }
}
