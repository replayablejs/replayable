import type { StatsMetricDefinition, StatsReading } from './metric.js';
import type { StatsSample } from './sampling.js';
import type { Stats } from './stats.js';

/** Owns card instances, recorded samples, and selection in registry order. */
export interface StatsCards {
  readonly elements: readonly HTMLDivElement[];
  readonly selectedLabel: string | undefined;
  /** Records readings without redrawing hidden cards. */
  record(sample: StatsSample): void;
  /** Selects the next available card without changing measurements. */
  cycle(): void;
  /** Resolves availability and redraws only displayed cards. */
  render(): void;
  /** Clears traces without changing availability, scales, or selection. */
  clearHistory(): void;
}

/** Owns the shell, stylesheet, accessibility, and input interception. */
export interface StatsShell {
  /** Describes the selected card and enables compact interaction only when one exists. */
  updateAccessibility(label: string | undefined): void;
  show(this: void): void;
  hide(this: void): void;
  destroy(): void;
}

/** Owns one metric's data and DOM. */
export interface StatsCard {
  /** Registry identifier used to route sampled readings to this card. */
  readonly key: StatsMetricDefinition['key'];
  readonly element: HTMLDivElement;
  readonly label: string;
  readonly available: boolean;
  /** Records one refresh without touching the DOM, including when not selected. */
  record(reading: StatsReading | undefined): void;
  /** Renders the stored reading and history without recording another sample. */
  render(): void;
  /** Discards the trace and current value, preserving lifetime range and scale. */
  clearHistory(): void;
}

/** DOM presentation only; lifecycle integration owns sampling subscriptions. */
export interface StatsView extends Stats {
  /** Records one refresh and redraws only the cards currently displayed. */
  update(sample: StatsSample): void;
  /** Explicitly discards traces across a measurement gap, independent of visibility. */
  clearHistory(): void;
}
