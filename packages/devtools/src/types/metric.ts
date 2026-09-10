import type { RuntimeStatsConfig } from '@replayablejs/runtime';

import type { StatsRange } from './range.js';

/** One metric's current reading. Frame average and graph peak intentionally differ. */
export interface StatsReading {
  readonly value: number;
  readonly graphValue: number;
  readonly range: StatsRange | undefined;
}

/** One metric owns its measurement window and lifetime extrema. */
export interface StatsMetric {
  /** Acquires measurement resources while visible; a no-op when no resources are needed. */
  start(): void;
  /** Releases external measurement work; the metric collection owns window reset. */
  stop(): void;
  /** Real interval and shared frame identity; zero marks the first frame after starting. */
  measure(deltaMilliseconds: number, frameTimestamp: number): void;
  /** Collects a reading and clears partial measurements, preserving lifetime extrema. */
  collect(): StatsReading | undefined;
  /** Discards partial measurements across a visibility gap, preserving extrema. */
  reset(): void;
}

/** Internal registration: measurement and presentation are connected in one place. */
export interface StatsMetricDefinition {
  readonly key: Exclude<keyof RuntimeStatsConfig, 'display'>;
  readonly label: string;
  readonly description: string;
  readonly ceiling: number;
  readonly initiallyAvailable: boolean;
  create(): StatsMetric;
}
