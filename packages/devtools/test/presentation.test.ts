// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { StatsView } from '../src/types/presentation.js';
import type { StatsSample } from '../src/types/sampling.js';
import { createTestView } from './fixtures/create-test-view.js';

const sample: StatsSample = new Map([
  ['fps', { value: 59.95, graphValue: 59.95, range: { min: 59.95, max: 59.95 } }],
  ['frameInterval', { value: 16.68, graphValue: 27.25, range: { min: 10, max: 27.25 } }],
  ['jsHeap', { value: 12.5, graphValue: 12.5, range: { min: 12.5, max: 12.5 } }],
]);
const views: StatsView[] = [];

afterEach(() => {
  for (const view of views.splice(0)) {
    view.destroy();
  }
  vi.restoreAllMocks();
});

describe('stats cards', () => {
  it('keeps show/hide presentation-only and resets history explicitly', () => {
    const view = createTestView({
      display: 'expanded',
      fps: true,
      frameInterval: false,
      jsHeap: false,
      drawCalls: false,
      textureBinds: false,
      programUses: false,
    });
    views.push(view);
    view.update(sample);
    view.update(sample);
    const graph = document.querySelector('.replayable-stats__graph-line');
    const path = graph?.getAttribute('d');
    expect(path).toBeTruthy();
    view.hide();
    view.show();
    expect(graph?.getAttribute('d')).toBe(path);
    view.clearHistory();
    expect(graph?.hasAttribute('d')).toBe(false);
  });

  it('shows measured ranges instead of scale ceilings and preserves them across hide/show', () => {
    const view = createTestView({
      display: 'expanded',
      fps: true,
      frameInterval: true,
      jsHeap: true,
      drawCalls: false,
      textureBinds: false,
      programUses: false,
    });
    views.push(view);
    const ranges = [...document.querySelectorAll('.replayable-stats__range')];
    expect(ranges).toHaveLength(3);
    expect(ranges.every((range) => range.hasAttribute('hidden'))).toBe(true);
    view.update(sample);
    expect(ranges.map((range) => range.textContent)).toEqual(['(60–60)', '(10–27)', '(13–13)']);
    expect(ranges.every((range) => !range.hasAttribute('hidden'))).toBe(true);
    expect(document.querySelector('.replayable-stats__graph-ceiling')).toBeNull();
    view.hide();
    view.show();
    expect(ranges[1]?.textContent).toBe('(10–27)');
    view.update(
      new Map(sample)
        .set('fps', { value: 60, graphValue: 60, range: { min: 0, max: 60 } })
        .set('frameInterval', { value: 16.68, graphValue: 27.25, range: undefined }),
    );
    expect(ranges[0]?.textContent).toBe('(0–60)');
    expect(ranges[1]?.hasAttribute('hidden')).toBe(true);
    expect(ranges[1]?.textContent).toBe('');
  });

  it('mounts outside gameplay and formats the enabled cards', () => {
    const view = createTestView({
      display: 'expanded',
      fps: true,
      frameInterval: true,
      jsHeap: true,
      drawCalls: false,
      textureBinds: false,
      programUses: false,
    });
    views.push(view);
    const shell = document.querySelector('.replayable-stats');
    expect(shell?.parentElement).toBe(document.body);
    expect(document.querySelector('[data-label="JS heap · MB"]')?.hasAttribute('hidden')).toBe(
      true,
    );
    view.update(sample);
    expect(document.querySelector('[data-label="FPS"] .replayable-stats__value')?.textContent).toBe(
      '60.0',
    );
    expect(
      document.querySelector('[data-label="Frame · ms"] .replayable-stats__value')?.textContent,
    ).toBe('16.7');
    expect(document.querySelector('.replayable-stats__detail')).toBeNull();
    expect(
      document.querySelector('[data-label="JS heap · MB"] .replayable-stats__value')?.textContent,
    ).toBe('12.5');
    expect(document.querySelector('[data-label="JS heap · MB"]')?.hasAttribute('hidden')).toBe(
      false,
    );
    view.hide();
    expect(shell?.hasAttribute('hidden')).toBe(true);
    view.show();
    expect(shell?.hasAttribute('hidden')).toBe(false);
  });

  it('reuses background graphs and clears traces on resume without shrinking scales', () => {
    const view = createTestView({
      display: 'expanded',
      fps: true,
      frameInterval: true,
      jsHeap: true,
      drawCalls: false,
      textureBinds: false,
      programUses: false,
    });
    views.push(view);
    const graphs = [...document.querySelectorAll('.replayable-stats__graph')];
    view.update(sample);
    view.update(
      new Map(sample)
        .set('fps', { value: 150, graphValue: 150, range: { min: 60, max: 150 } })
        .set('frameInterval', { value: 20, graphValue: 210, range: { min: 10, max: 210 } }),
    );
    expect(document.querySelectorAll('.replayable-stats__graph-line[d]')).toHaveLength(3);
    expect(graphs[0]?.querySelector('text')).toBeNull();
    expect(graphs[1]?.querySelector('text')).toBeNull();
    expect([...document.querySelectorAll('.replayable-stats__graph')]).toEqual(graphs);
    view.hide();
    view.clearHistory();
    view.show();
    expect(document.querySelectorAll('.replayable-stats__graph-line[d]')).toHaveLength(0);
    expect(graphs[0]?.querySelector('text')).toBeNull();
    view.update(sample);
    expect(document.querySelectorAll('.replayable-stats__graph-line[d]')).toHaveLength(0);
    view.update(sample);
    expect(document.querySelectorAll('.replayable-stats__graph-line[d]')).toHaveLength(3);
  });

  it('omits disabled cards and hides unsupported heap measurements', () => {
    const view = createTestView({
      display: 'expanded',
      fps: false,
      frameInterval: true,
      jsHeap: true,
      drawCalls: false,
      textureBinds: false,
      programUses: false,
    });
    views.push(view);
    view.update(new Map(sample).set('jsHeap', undefined));
    expect(document.querySelector('[data-label="FPS"]')).toBeNull();
    expect(document.querySelector('[data-label="JS heap · MB"]')?.hasAttribute('hidden')).toBe(
      true,
    );
  });

  it('removes its markup and styles without touching existing document styles', () => {
    const originalStyles = document.head.querySelectorAll('style').length;
    const view = createTestView({
      display: 'expanded',
      fps: true,
      frameInterval: false,
      jsHeap: false,
      drawCalls: false,
      textureBinds: false,
      programUses: false,
    });
    views.push(view);
    expect(document.head.querySelectorAll('style')).toHaveLength(originalStyles + 1);
    view.destroy();
    view.destroy();
    view.show();
    expect(document.querySelector('.replayable-stats')).toBeNull();
    expect(document.head.querySelectorAll('style')).toHaveLength(originalStyles);
  });
});
