import type { StatsCard } from './presentation.js';

/** Tracks selection without recording samples or changing card DOM. */
export interface StatsCardSelection {
  readonly current: StatsCard | undefined;
  /** Keeps an available selection or falls back to the first available card. */
  resolve(): void;
  /** Moves to the next available card in registry order, wrapping at the end. */
  cycle(this: void): void;
}
