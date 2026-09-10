import type { Stats } from '#types/stats.js';

import { disabledStats } from './disabled-stats.js';

/** Disabled entry imports no runtime, measurement, presentation, or graph dependencies. */
export function createStats(): Stats {
  return disabledStats;
}
