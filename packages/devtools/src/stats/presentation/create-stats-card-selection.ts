import type { StatsCardSelection } from '#types/card-selection.js';
import type { StatsCard } from '#types/presentation.js';

/** Owns available-card selection and cycling; it never renders or changes measurements. */
export function createStatsCardSelection(cards: readonly StatsCard[]): StatsCardSelection {
  let current = cards.find((card) => card.available);

  return {
    get current(): StatsCard | undefined {
      return current;
    },
    resolve,
    cycle,
  };

  /** Preserves selection while available; an empty collection has no selected card. */
  function resolve(): void {
    if (!current?.available) {
      current = cards.find((card) => card.available);
    }
  }

  /** Skips unavailable cards and wraps without recording or clearing their history. */
  function cycle(): void {
    const available = cards.filter((card) => card.available);
    if (available.length === 0) {
      return;
    }

    const index = current === undefined ? -1 : available.indexOf(current);
    current = available[(index + 1) % available.length];
  }
}
