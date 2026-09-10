// @vitest-environment happy-dom
import { expect, it, vi } from 'vitest';

import { createStatsSampler } from '../src/stats/measurement/create-stats-sampler.js';
import { createStatsCard } from '../src/stats/presentation/create-stats-card.js';
import { STATS_METRICS } from '../src/stats/stats-metrics.js';
import type { StatsMetric, StatsMetricDefinition } from '../src/types/metric.js';

it('creates every registered measurement independently for each stats instance', () => {
  const keys = STATS_METRICS.map(({ key }) => key);
  expect(new Set(keys).size).toBe(keys.length);
  for (const definition of STATS_METRICS) {
    expect(definition.create()).not.toBe(definition.create());
  }
});

it('runs a replacement metric through sampler and card without built-in assumptions', () => {
  const measure = vi.fn<StatsMetric['measure']>();
  const reset = vi.fn<StatsMetric['reset']>();
  const reading = { value: 7, graphValue: 42, range: { min: 3, max: 9 } };
  const collect = vi.fn<StatsMetric['collect']>(() => reading);
  const start = vi.fn<StatsMetric['start']>();
  const stop = vi.fn<StatsMetric['stop']>();
  const create = vi.fn<StatsMetricDefinition['create']>(() => ({
    start,
    stop,
    measure,
    reset,
    collect,
  }));
  // Reuse an authored toggle, but replace all measurement and display semantics.
  const definition: StatsMetricDefinition = {
    key: 'fps',
    label: 'Custom metric',
    description: 'Test reading',
    ceiling: 100,
    initiallyAvailable: true,
    create,
  };
  const sampler = createStatsSampler([definition]);
  const card = createStatsCard(definition);
  expect(card.key).toBe(definition.key);
  expect(create).toHaveBeenCalledTimes(1);
  sampler.reset(0);
  expect(reset).toHaveBeenCalledTimes(1);
  sampler.update(0);
  sampler.update(100);
  expect(collect).not.toHaveBeenCalled();
  const first = sampler.update(500);
  expect(measure.mock.calls).toEqual([
    [0, 0],
    [100, 100],
    [400, 500],
  ]);
  expect(collect).toHaveBeenCalledTimes(1);
  card.record(first?.get(definition.key));
  card.record(sampler.update(1000)?.get(definition.key));
  card.render();
  expect(card.element.querySelector('.replayable-stats__label')?.textContent).toBe('Custom metric');
  expect(card.element.querySelector('.replayable-stats__value')?.textContent).toBe('7.0');
  expect(card.element.querySelector('.replayable-stats__range')?.textContent).toBe('(3–9)');
  expect(card.element.title).toBe('Test reading');
  expect(card.element.querySelector('.replayable-stats__graph-line')?.getAttribute('d')).toBe(
    'M92.441,32.16L94,32.16',
  );
  reset.mockClear();
  sampler.stop();
  expect(stop).toHaveBeenCalledTimes(1);
  expect(reset).toHaveBeenCalledTimes(1);
});

it('collects nothing and instantiates nothing when no definitions are enabled', () => {
  const sampler = createStatsSampler([]);
  sampler.reset(0);
  sampler.update(0);
  expect(sampler.update(500)?.size).toBe(0);
});
