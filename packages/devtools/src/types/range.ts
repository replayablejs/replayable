/** Observed values, not graph scale limits. Both endpoints use the metric's unit. */
export interface StatsRange {
  readonly min: number;
  readonly max: number;
}

/** A lifetime accumulator; a new instance is the only way to reset its range. */
export interface StatsRangeTracker {
  /** Immutable snapshot; absent until the first valid observation. */
  readonly current: StatsRange | undefined;
  /** Accepts finite, non-negative measurements, including a valid zero. */
  observe(value: number): void;
}
