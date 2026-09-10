import type { StatsMetricDefinition, StatsReading } from './metric.js';

/** A refresh's readings keyed by their registry identifier; unavailable readings are absent values. */
export type StatsSample = ReadonlyMap<StatsMetricDefinition['key'], StatsReading | undefined>;

/** Coordinates enabled metrics using the sampling clock's measurement and refresh cadence. */
export interface StatsSampler {
  /** Acquires external metric sources while sampling is visible. */
  start(this: void): void;
  /** Releases sources and discards unfinished measurements. */
  stop(this: void): void;
  /** Starts a fresh baseline and resets partial measurements, not lifetime extrema. */
  reset(timestamp: number): void;
  /** Measures this frame and collects every enabled metric at most once per 500 ms. */
  update(timestamp: number): StatsSample | undefined;
}
