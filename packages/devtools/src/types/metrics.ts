import type { StatsSample } from './sampling.js';

/** Enabled metric instances, independent of frame timing and presentation. */
export interface StatsMetrics {
  start(this: void): void;
  stop(this: void): void;
  /** Discards partial measurements while each metric retains its lifetime extrema. */
  reset(): void;
  /** Can be passed directly to the sampling clock; it does not depend on this. */
  measure(this: void, deltaMilliseconds: number, frameTimestamp: number): void;
  /** Collects a fresh snapshot keyed by the metric registry identifiers. */
  collect(): StatsSample;
}
