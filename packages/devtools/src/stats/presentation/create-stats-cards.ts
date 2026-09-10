import type { RuntimeStatsConfig } from '@replayablejs/runtime';

import type { StatsMetricDefinition } from '#types/metric.js';
import type { StatsCard, StatsCards } from '#types/presentation.js';
import type { StatsSample } from '#types/sampling.js';

import { createStatsCardSelection } from './create-stats-card-selection.js';
import { createStatsCard } from './create-stats-card.js';

/** Owns card instances, recorded samples, and selection in registry order. */
export function createStatsCards(
  definitions: readonly StatsMetricDefinition[],
  display: RuntimeStatsConfig['display'],
): StatsCards {
  const cards = definitions.map(createStatsCard);
  const selection = createStatsCardSelection(cards);
  const render = display === 'compact' ? renderCompact : renderExpanded;

  return {
    elements: cards.map((card) => card.element),
    get selectedLabel(): string | undefined {
      return selection.current?.label;
    },
    record,
    cycle: selection.cycle,
    render,
    clearHistory,
  };

  /** Hidden cards still receive samples so cycling never loses their history. */
  function record(sample: StatsSample): void {
    for (const card of cards) {
      card.record(sample.get(card.key));
    }
  }

  /** Displays only the selected available card; hidden cards retain their history. */
  function renderCompact(): void {
    selection.resolve();

    for (const card of cards) {
      renderCard(card, card === selection.current);
    }
  }

  /** Displays every available card without resolving compact selection. */
  function renderExpanded(): void {
    for (const card of cards) {
      renderCard(card, card.available);
    }
  }

  /** Clears traces, preserving availability, scales, and selection. */
  function clearHistory(): void {
    for (const card of cards) {
      card.clearHistory();
    }
  }

  /** Applies visibility and avoids redrawing hidden cards in either display mode. */
  function renderCard(card: StatsCard, visible: boolean): void {
    card.element.hidden = !visible;

    if (visible) {
      card.render();
    }
  }
}
