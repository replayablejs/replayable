import type { StatsRange, StatsRangeTracker } from '#types/range.js';

/** Tracks extrema without storing samples or allocating on each measured frame. */
export function createStatsRange(): StatsRangeTracker {
  let min = Infinity;
  let max = -Infinity;

  return {
    get current(): StatsRange | undefined {
      return min === Infinity ? undefined : { min, max };
    },
    observe(value): void {
      if (!Number.isFinite(value) || value < 0) {
        return;
      }
      min = Math.min(min, value);
      max = Math.max(max, value);
    },
  };
}
