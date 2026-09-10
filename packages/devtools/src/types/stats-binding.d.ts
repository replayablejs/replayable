declare module '#stats' {
  import type { Stats } from '#types/stats.js';

  /** Stats implementation selected by Replayable's Vite pipeline. */
  export function createStats(): Stats;
}
