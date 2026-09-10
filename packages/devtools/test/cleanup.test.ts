import { expect, it, vi } from 'vitest';

import { failStatsSetup, runStatsCleanup } from '../src/stats/lifecycle/run-stats-cleanup.js';
import { createStatsMetrics } from '../src/stats/measurement/create-stats-metrics.js';
import type { StatsMetric, StatsMetricDefinition } from '../src/types/metric.js';

it('attempts every cleanup and preserves multiple failures in order', () => {
  const first = new Error('First failure');
  const last = new Error('Last failure');
  const middle = vi.fn<() => void>();
  expect(() =>
    runStatsCleanup([
      () => {
        throw first;
      },
      middle,
      () => {
        throw last;
      },
    ]),
  ).toThrow(expect.objectContaining({ errors: [first, last] }));
  expect(middle).toHaveBeenCalledOnce();
});

it('preserves both startup and rollback failure identities', () => {
  const startup = new Error('Startup failed');
  const rollback = new Error('Rollback failed');
  expect(() =>
    failStatsSetup(startup, () => {
      throw rollback;
    }),
  ).toThrow(expect.objectContaining({ errors: [startup, rollback], cause: startup }));
  expect(() => failStatsSetup(startup, () => {})).toThrow(startup);
});

it('stops and resets every metric even if an earlier metric throws', () => {
  const failure = new Error('Metric stop failed');
  const resetFirst = vi.fn<() => void>();
  const stopSecond = vi.fn<() => void>();
  const resetSecond = vi.fn<() => void>();
  const metric: StatsMetric = {
    start() {},
    stop() {
      throw failure;
    },
    reset: resetFirst,
    measure() {},
    collect() {
      return undefined;
    },
  };
  const definition: StatsMetricDefinition = {
    key: 'fps',
    label: 'FPS',
    description: '',
    ceiling: 120,
    initiallyAvailable: true,
    create: () => metric,
  };
  const metrics = createStatsMetrics([
    definition,
    {
      ...definition,
      key: 'frameInterval',
      create: () => ({ ...metric, stop: stopSecond, reset: resetSecond }),
    },
  ]);
  expect(metrics.stop).toThrow(failure);
  expect(resetFirst).toHaveBeenCalledOnce();
  expect(stopSecond).toHaveBeenCalledOnce();
  expect(resetSecond).toHaveBeenCalledOnce();
});
