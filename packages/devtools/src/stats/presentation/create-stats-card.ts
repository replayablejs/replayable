import type { StatsMetricDefinition, StatsReading } from '#types/metric.js';
import type { StatsCard } from '#types/presentation.js';
import type { StatsRange } from '#types/range.js';

import { createStatsCardElements } from './create-stats-card-elements.js';
import { createStatsGraph, STATS_HISTORY_LENGTH } from './create-stats-graph.js';

/** Owns one metric's recorded history and renders it into reusable card elements. */
export function createStatsCard(metric: StatsMetricDefinition): StatsCard {
  const graph = createStatsGraph(metric.ceiling);
  const elements = createStatsCardElements(metric, graph.element);
  const history: number[] = [];
  let isAvailable = metric.initiallyAvailable;
  let currentValue: number | undefined;
  let currentRange: StatsRange | undefined;

  return {
    key: metric.key,
    element: elements.root,
    label: metric.label,
    get available(): boolean {
      return isAvailable;
    },
    record,
    render,
    clearHistory,
  };

  /** Records data and graph peaks without redrawing, including while this card is hidden. */
  function record(reading: StatsReading | undefined): void {
    isAvailable = reading !== undefined;
    if (reading === undefined) {
      // An unavailable reading is not zero. Break the trace rather than connecting
      // observations across a reporting gap; keep the last lifetime range.
      clearHistory();
      return;
    }

    currentValue = reading.value;
    currentRange = reading.range;
    history.push(reading.graphValue);
    if (history.length > STATS_HISTORY_LENGTH) {
      history.shift();
    }
    graph.observe(reading.graphValue);
  }

  /** Draws stored values and history without recording another observation. */
  function render(): void {
    elements.value.textContent = currentValue?.toFixed(1) ?? '—';
    elements.range.hidden = currentRange === undefined;
    elements.range.textContent = formatRange(currentRange);
    graph.render(history);
  }

  /** Discards the trace and value, preserving availability, lifetime range, and graph scale. */
  function clearHistory(): void {
    history.length = 0;
    currentValue = undefined;
  }
}

/** Formats lifetime extrema as a compact label, leaving an unavailable range empty. */
function formatRange(range: StatsRange | undefined): string {
  if (range === undefined) {
    return '';
  }

  return `(${Math.round(range.min)}–${Math.round(range.max)})`;
}
