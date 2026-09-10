// @vitest-environment happy-dom
import { expect, it } from 'vitest';

import { createStatsCard } from '../src/stats/presentation/create-stats-card.js';
import { STATS_METRICS } from '../src/stats/stats-metrics.js';
import type { StatsReading } from '../src/types/metric.js';

function sample(value: number): StatsReading {
  return { value: value / 2, graphValue: value, range: { min: 0, max: value } };
}

it('defines each built-in metric once in presentation order', () => {
  expect(STATS_METRICS.map(({ key, ceiling }) => [key, ceiling])).toEqual([
    ['fps', 120],
    ['frameInterval', 100],
    ['jsHeap', 64],
    ['drawCalls', 100],
    ['textureBinds', 100],
    ['programUses', 100],
  ]);
});

it.each(STATS_METRICS)(
  'records $key without touching DOM and retains only the newest 60 samples',
  (metric) => {
    const card = createStatsCard(metric);
    const initial = card.element.outerHTML;
    for (let index = 0; index < 70; index += 1) {
      card.record(sample(index));
    }
    expect(card.element.outerHTML).toBe(initial);
    card.render();
    const path = card.element.querySelector('.replayable-stats__graph-line')?.getAttribute('d');
    expect(path?.match(/L/g)).toHaveLength(59);
    // First retained value is 10; the scale spans 0–120, 0–100, or 0–128.
    const ceiling = metric.key === 'jsHeap' ? 128 : metric.ceiling;
    const firstY = Number((54 - (10 / ceiling) * 52).toFixed(3));
    expect(path).toContain(`M2,${firstY}L`);
    const rendered = card.element.outerHTML;
    card.render();
    expect(card.element.outerHTML).toBe(rendered);
  },
);

it.each(STATS_METRICS)(
  'clears $key history explicitly while retaining its range and scale',
  (metric) => {
    const card = createStatsCard(metric);
    card.record(sample(500));
    card.record(sample(20));
    card.render();
    const range = card.element.querySelector('.replayable-stats__range')?.textContent;
    const nodes = [...card.element.children];
    card.clearHistory();
    card.render();
    expect(card.element.querySelector('path[d]')).toBeNull();
    expect(card.element.querySelector('.replayable-stats__value')?.textContent).toBe('—');
    expect(card.element.querySelector('.replayable-stats__range')?.textContent).toBe(range);
    card.record(sample(20));
    card.render();
    expect(card.element.querySelector('path[d]')).toBeNull();
    card.record(sample(20));
    card.render();
    expect([...card.element.children]).toEqual(nodes);
    // The 500-unit peak still controls the scale after the history reset.
    let ceiling = metric.ceiling;
    while (ceiling < 500) {
      ceiling *= 2;
    }
    const y = Number((54 - (20 / ceiling) * 52).toFixed(3));
    expect(card.element.querySelector('.replayable-stats__graph-line')?.getAttribute('d')).toBe(
      `M92.441,${y}L94,${y}`,
    );
  },
);

it('displays the frame average while graphing its peak', () => {
  const metric = STATS_METRICS.find(({ key }) => key === 'frameInterval');
  if (metric === undefined) {
    throw new Error('Missing frame metric');
  }
  const card = createStatsCard(metric);
  card.record(sample(100));
  card.record(sample(100));
  card.render();
  expect(card.element.querySelector('.replayable-stats__value')?.textContent).toBe('50.0');
  expect(card.element.querySelector('.replayable-stats__graph-line')?.getAttribute('d')).toBe(
    'M92.441,2L94,2',
  );
});
