import type { RuntimeStatsConfig } from '@replayablejs/runtime';

import { createStatsView } from '../../src/stats/presentation/create-stats-view.js';
import { STATS_METRICS } from '../../src/stats/stats-metrics.js';
import type { StatsView } from '../../src/types/presentation.js';

/** Selects built-ins as createStats does, without requiring runtime lifecycle setup. */
export function createTestView(config: RuntimeStatsConfig): StatsView {
  return createStatsView(
    STATS_METRICS.filter((metric) => config[metric.key]),
    config.display,
  );
}
