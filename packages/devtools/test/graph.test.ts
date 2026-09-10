// @vitest-environment happy-dom
import { expect, it } from 'vitest';

import { createStatsGraph } from '../src/stats/presentation/create-stats-graph.js';

it('uses the agreed initial bounds and retains peaks without redrawing', () => {
  const graph = createStatsGraph(120);
  graph.observe(120);
  expect(graph.ceiling).toBe(120);
  graph.observe(500);
  expect(graph.ceiling).toBe(960);
  expect(graph.element.querySelector('text')).toBeNull();
  graph.observe(10);
  graph.render([]);
  expect(graph.ceiling).toBe(960);
  expect(graph.element.querySelector('text')).toBeNull();
});

it('keeps short histories on the right and uses all 60 fixed slots', () => {
  const graph = createStatsGraph(100);
  graph.render([0, 100]);
  expect(graph.element.querySelector('.replayable-stats__graph-line')?.getAttribute('d')).toBe(
    'M92.441,54L94,2',
  );
  graph.render(Array.from({ length: 60 }, () => 100));
  const path = graph.element.querySelector('.replayable-stats__graph-line')?.getAttribute('d');
  expect(path).toMatch(/^M2,2L/);
  expect(path).toMatch(/L94,2$/);
  expect(path).not.toMatch(/[CQ]/);
});

it('reuses nodes, renders constant and zero samples, and clears short histories', () => {
  const graph = createStatsGraph(100);
  const nodes = [...graph.element.children];
  graph.render([0, 0]);
  expect(nodes[0]?.getAttribute('d')).toBeTruthy();
  expect(nodes[1]?.getAttribute('d')).toBe('M92.441,54L94,54');
  graph.render([50, 50]);
  expect(nodes[1]?.getAttribute('d')).toBe('M92.441,28L94,28');
  graph.render([50]);
  expect(nodes[0]?.hasAttribute('d')).toBe(false);
  expect(nodes[1]?.hasAttribute('d')).toBe(false);
  graph.render([]);
  expect([...graph.element.children]).toEqual(nodes);
  expect(graph.element.outerHTML).not.toContain('NaN');
});

it('rescales both paths after a peak without clipping it', () => {
  const graph = createStatsGraph(100);
  graph.observe(200);
  graph.render([0, 200]);
  expect(graph.element.querySelector('.replayable-stats__graph-line')?.getAttribute('d')).toBe(
    'M92.441,54L94,2',
  );
  expect(graph.element.querySelector('.replayable-stats__graph-area')?.getAttribute('d')).toBe(
    'M92.441,54L94,2L94,54L92.441,54Z',
  );
});
