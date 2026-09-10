import { afterEach, expect, it, vi } from 'vitest';

import { createWebglMetric } from '../src/stats/measurement/metrics/create-webgl-metric.js';
import type { StatsWebglFrameListener } from '../src/types/webgl.js';

const source = vi.hoisted(() => ({ listeners: new Set<StatsWebglFrameListener>() }));
vi.mock('../src/stats/webgl/subscribe-webgl-frames.js', () => ({
  collectWebglFrame: vi.fn<(timestamp: number) => void>(),
  subscribeWebglFrames(listener: StatsWebglFrameListener) {
    source.listeners.add(listener);
    return () => {
      source.listeners.delete(listener);
    };
  },
}));
afterEach(() => {
  source.listeners.clear();
});

it.each(['drawCalls', 'textureBinds', 'programUses'] as const)(
  'measures %s from shared completed frames',
  (key) => {
    const metric = createWebglMetric(key);
    expect(source.listeners.size).toBe(0);
    metric.start();
    metric.start();
    expect(source.listeners.size).toBe(1);
    for (const value of [0, 3, 9]) {
      for (const listener of source.listeners) {
        listener(100, { drawCalls: value, textureBinds: value, programUses: value });
      }
    }
    expect(metric.collect()).toEqual({ value: 4, graphValue: 9, range: { min: 0, max: 9 } });
    expect(metric.collect()).toBeUndefined();
    for (const listener of source.listeners) {
      listener(200, undefined);
    }
    expect(metric.collect()).toBeUndefined();
    metric.stop();
    expect(source.listeners.size).toBe(0);
    metric.start();
    for (const listener of source.listeners) {
      listener(300, { drawCalls: 2, textureBinds: 2, programUses: 2 });
    }
    expect(metric.collect()).toEqual({ value: 2, graphValue: 2, range: { min: 0, max: 9 } });
    metric.stop();
  },
);
