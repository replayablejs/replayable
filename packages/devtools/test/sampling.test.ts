import type { RuntimeStatsConfig } from '@replayablejs/runtime';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createStatsSampler } from '../src/stats/measurement/create-stats-sampler.js';
import { createJsHeapMetric } from '../src/stats/measurement/metrics/create-js-heap-metric.js';
import { STATS_METRICS } from '../src/stats/stats-metrics.js';
import type { StatsSampler } from '../src/types/sampling.js';

const config: RuntimeStatsConfig = {
  display: 'expanded',
  fps: true,
  frameInterval: true,
  jsHeap: true,
  drawCalls: false,
  textureBinds: false,
  programUses: false,
};

function createSampler(settings: RuntimeStatsConfig): StatsSampler {
  return createStatsSampler(STATS_METRICS.filter((metric) => settings[metric.key]));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('frame measurement and refresh', () => {
  it('measures before publishing at 500 ms and skips catch-up after stalls', () => {
    const sampler = createSampler({
      ...config,
      jsHeap: false,
    });
    sampler.reset(0);
    expect(sampler.update(0)).toBeUndefined();
    expect(sampler.update(20)).toBeUndefined();
    expect(sampler.update(499)).toBeUndefined();
    const sample = sampler.update(500);
    expect(sample?.get('fps')?.value).toBe(6);
    expect(sample?.get('frameInterval')).toEqual({
      value: 500 / 3,
      graphValue: 479,
      range: { min: 1, max: 479 },
    });
    expect(sampler.update(5000)?.get('frameInterval')?.graphValue).toBe(4500);
    expect(sampler.update(5000)).toBeUndefined();
    expect(sampler.update(5499)).toBeUndefined();
    expect(sampler.update(5500)?.get('fps')?.value).toBe(4);
  });

  it('preserves intervals crossing refreshes and clears only the window peak', () => {
    const sampler = createSampler({
      ...config,
      jsHeap: false,
    });
    sampler.reset(0);
    sampler.update(0);
    sampler.update(500);
    for (let time = 520; time < 1000; time += 20) {
      expect(sampler.update(time)).toBeUndefined();
    }
    const sample = sampler.update(1000);
    expect(sample?.get('fps')).toEqual({ value: 50, graphValue: 50, range: { min: 2, max: 50 } });
    expect(sample?.get('frameInterval')).toEqual({
      value: 20,
      graphValue: 20,
      range: { min: 20, max: 500 },
    });
  });

  it('excludes visibility gaps but retains lifetime extrema and partial-window intervals', () => {
    const sampler = createSampler({
      ...config,
      display: 'compact',
      jsHeap: false,
    });
    sampler.reset(0);
    sampler.update(0);
    sampler.update(10);
    const first = sampler.update(500);
    sampler.update(1500);
    sampler.update(1505);
    sampler.reset(10_000);
    expect(sampler.update(10_000)).toBeUndefined();
    const sample = sampler.update(10_500);
    expect(sample?.get('fps')?.range).toEqual({ min: 1, max: 4 });
    expect(sample?.get('frameInterval')?.range).toEqual({ min: 5, max: 1000 });
    expect(first?.get('frameInterval')?.range).toEqual({ min: 10, max: 490 });
    const fresh = createSampler({
      ...config,
      jsHeap: false,
    });
    fresh.reset(0);
    fresh.update(0);
    expect(fresh.update(500)?.get('frameInterval')?.range).toEqual({ min: 500, max: 500 });
  });

  it('waits for complete intervals and ignores identical timestamps', () => {
    const sampler = createSampler({
      ...config,
      jsHeap: false,
    });
    sampler.reset(0);
    expect(sampler.update(500)).toBeUndefined();
    expect(sampler.update(500)).toBeUndefined();
    expect(sampler.update(1000)?.get('fps')?.value).toBe(2);
  });

  it('reads heap only on refresh and retains extrema across unavailable readings', () => {
    let bytes = 0;
    const memory = vi.fn<() => { usedJSHeapSize: number }>(() => ({ usedJSHeapSize: bytes }));
    vi.stubGlobal('performance', {
      get memory() {
        return memory();
      },
    });
    const sampler = createSampler({ ...config, fps: false, frameInterval: false });
    sampler.reset(0);
    sampler.update(0);
    sampler.update(250);
    expect(memory).not.toHaveBeenCalled();
    const sample = sampler.update(500);
    expect([...(sample?.keys() ?? [])]).toEqual(['jsHeap']);
    expect(sample?.get('jsHeap')?.range).toEqual({ min: 0, max: 0 });
    bytes = 12_000_000;
    expect(sampler.update(1000)?.get('jsHeap')?.range).toEqual({ min: 0, max: 12 });
    bytes = NaN;
    expect(sampler.update(1500)?.get('jsHeap')).toBeUndefined();
    bytes = 6_000_000;
    expect(sampler.update(2000)?.get('jsHeap')?.range).toEqual({ min: 0, max: 12 });
    expect(memory).toHaveBeenCalledTimes(4);
    const disabled = createSampler({
      ...config,
      jsHeap: false,
    });
    disabled.reset(0);
    disabled.update(0);
    expect(disabled.update(500)?.get('jsHeap')?.range).toBeUndefined();
    expect(memory).toHaveBeenCalledTimes(4);
  });
});

describe('optional JavaScript heap', () => {
  it('ignores browsers without the memory API', () => {
    vi.stubGlobal('performance', {});
    expect(createJsHeapMetric().collect()).toBeUndefined();
  });

  it.each([
    undefined,
    null,
    {},
    { usedJSHeapSize: -1 },
    { usedJSHeapSize: Infinity },
    { usedJSHeapSize: NaN },
    { usedJSHeapSize: '12' },
  ])('ignores invalid heap %j', (memory) => {
    vi.stubGlobal('performance', { memory });
    expect(createJsHeapMetric().collect()).toBeUndefined();
  });
  it('retains a valid zero-byte estimate', () => {
    vi.stubGlobal('performance', { memory: { usedJSHeapSize: 0 } });
    expect(createJsHeapMetric().collect()).toEqual({
      value: 0,
      graphValue: 0,
      range: { min: 0, max: 0 },
    });
  });
});
