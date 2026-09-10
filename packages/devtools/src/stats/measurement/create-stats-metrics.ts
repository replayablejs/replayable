import type { StatsMetricDefinition, StatsReading } from '#types/metric.js';
import type { StatsMetrics } from '#types/metrics.js';
import type { StatsSample } from '#types/sampling.js';

import { failStatsSetup, runStatsCleanup } from '../lifecycle/run-stats-cleanup.js';

/** Creates independent measurement instances for the enabled registry definitions. */
export function createStatsMetrics(definitions: readonly StatsMetricDefinition[]): StatsMetrics {
  const metrics = definitions.map((definition) => ({
    key: definition.key,
    metric: definition.create(),
  }));

  return { start, stop, reset, measure, collect };

  /** CPU metrics need no subscription; external metrics acquire their shared source. */
  function start(): void {
    try {
      for (const { metric } of metrics) {
        metric.start();
      }
    } catch (error) {
      return failStatsSetup(error, stop);
    }
  }

  /** Release sources before discarding a partial window; lifetime ranges survive. */
  function stop(): void {
    runStatsCleanup(metrics.flatMap(({ metric }) => [() => metric.stop(), () => metric.reset()]));
  }

  /** Delegates window cleanup; the collection does not own individual metric state. */
  function reset(): void {
    for (const { metric } of metrics) {
      metric.reset();
    }
  }

  /** Every enabled metric receives the same real, unclamped frame interval. */
  function measure(deltaMilliseconds: number, frameTimestamp: number): void {
    for (const { metric } of metrics) {
      metric.measure(deltaMilliseconds, frameTimestamp);
    }
  }

  /** Preserves unavailable readings as undefined and leaves earlier snapshots untouched. */
  function collect(): StatsSample {
    const readings = new Map<StatsMetricDefinition['key'], StatsReading | undefined>();

    for (const { key, metric } of metrics) {
      readings.set(key, metric.collect());
    }

    return readings;
  }
}
