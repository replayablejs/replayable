import { playable } from '@replayablejs/runtime';

import type { Stats } from '#types/stats.js';

import { disabledStats } from './stats/disabled-stats.js';
import { createStatsLifecycle } from './stats/lifecycle/create-stats-lifecycle.js';
import { createStatsSampler } from './stats/measurement/create-stats-sampler.js';
import { createStatsView } from './stats/presentation/create-stats-view.js';
import { STATS_METRICS } from './stats/stats-metrics.js';

/** Creates optional development stats after await playable.ready(). */
export function createStats(): Stats {
  const config = playable.config.devtools.stats;
  // The pipeline selects this entry only for enabled stats. Keep the guard for
  // the runtime configuration's false | settings type and safe direct use.
  if (config === false) {
    return disabledStats;
  }

  const metrics = STATS_METRICS.filter((metric) => config[metric.key]);
  if (metrics.length === 0) {
    return disabledStats;
  }

  requireRuntimeReady();

  const sampler = createStatsSampler(metrics);
  const view = createStatsView(metrics, config.display);

  return createStatsLifecycle(sampler, view);
}

/** Requires await playable.ready() before stats can allocate DOM or subscribe. */
function requireRuntimeReady(): void {
  // Runtime exposes state only after initialization; its getter owns the error.
  void playable.state;
}
