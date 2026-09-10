import type { RuntimeStatsConfig } from '@replayablejs/runtime';

import type { StatsMetricDefinition } from '#types/metric.js';
import type { StatsView } from '#types/presentation.js';
import type { StatsSample } from '#types/sampling.js';

import { createStatsCards } from './create-stats-cards.js';
import { createStatsShell } from './create-stats-shell.js';

/** Coordinates metric cards and their mounted presentation shell. */
export function createStatsView(
  definitions: readonly StatsMetricDefinition[],
  display: RuntimeStatsConfig['display'],
): StatsView {
  const cards = createStatsCards(definitions, display);
  const shell = createStatsShell(cards.elements, display, cycleCard);
  render();

  return { update, clearHistory, show: shell.show, hide: shell.hide, destroy };

  /** Records a refresh before redrawing the visible cards. */
  function update(sample: StatsSample): void {
    cards.record(sample);
    render();
  }

  /** Clears traces after a measurement gap without changing selection. */
  function clearHistory(): void {
    cards.clearHistory();
    render();
  }

  /** Changes the displayed card without recording another sample. */
  function cycleCard(): void {
    cards.cycle();
    render();
  }

  /** Keeps shell accessibility in sync with resolved card selection. */
  function render(): void {
    cards.render();
    shell.updateAccessibility(cards.selectedLabel);
  }

  /** Releases recorded histories and removes the shell without a final redraw. */
  function destroy(): void {
    shell.destroy();
    cards.clearHistory();
  }
}
