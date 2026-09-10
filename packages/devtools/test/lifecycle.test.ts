// @vitest-environment happy-dom
import type { RuntimeStatsConfig, PostRenderContext } from '@replayablejs/runtime';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createStats } from '../src/create-stats.js';
import { createStatsLifecycle } from '../src/stats/lifecycle/create-stats-lifecycle.js';
import { registerWebglContext } from '../src/stats/webgl/context-registry.js';
import type { StatsView } from '../src/types/presentation.js';
import type { StatsSampler } from '../src/types/sampling.js';
import type { Stats } from '../src/types/stats.js';

const runtime = vi.hoisted(() => ({
  ready: false,
  visible: true,
  stats: {
    display: 'expanded',
    fps: true,
    frameInterval: true,
    jsHeap: false,
    drawCalls: false,
    textureBinds: false,
    programUses: false,
  } as false | RuntimeStatsConfig,
  updates: new Set<(context: PostRenderContext) => void>(),
  visibility: new Set<(visible: boolean) => void>(),
}));

vi.mock('@replayablejs/runtime', () => ({
  playable: {
    get config() {
      return { devtools: { stats: runtime.stats } };
    },
    get state() {
      if (!runtime.ready) {
        throw new Error('Await playable.ready() first.');
      }
      return { visible: runtime.visible };
    },
    postRender: {
      add(listener: (context: PostRenderContext) => void): () => void {
        runtime.updates.add(listener);
        return () => {
          runtime.updates.delete(listener);
        };
      },
    },
    on(event: string, listener: (visible: boolean) => void): () => void {
      if (event !== 'visibilitychange') {
        throw new Error(`Unexpected lifecycle subscription: ${event}`);
      }
      runtime.visibility.add(listener);
      return () => {
        runtime.visibility.delete(listener);
      };
    },
  },
}));

const controls: Stats[] = [];
let now = 0;

beforeEach(() => {
  now = 0;
  runtime.ready = true;
  runtime.visible = true;
  runtime.stats = {
    display: 'expanded',
    fps: true,
    frameInterval: true,
    jsHeap: false,
    drawCalls: false,
    textureBinds: false,
    programUses: false,
  };
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});

afterEach(() => {
  for (const stats of controls.splice(0)) {
    stats.destroy();
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function start(): Stats {
  const stats = createStats();
  controls.push(stats);
  return stats;
}

function frame(timestamp: number, render: () => void = () => {}): void {
  now = timestamp;
  render();
  for (const listener of [...runtime.updates]) {
    listener({ timestamp });
  }
}

function setVisible(visible: boolean): void {
  runtime.visible = visible;
  for (const listener of runtime.visibility) {
    listener(visible);
  }
}

it('rejects creation before readiness without allocating DOM or subscriptions', () => {
  runtime.ready = false;
  expect(createStats).toThrow('Await playable.ready() first.');
  expect(document.querySelector('.replayable-stats')).toBeNull();
});

it('destroys the mounted view and subscriptions even when sampling cleanup throws', () => {
  const failure = new Error('Source cleanup failed');
  const sampler: StatsSampler = {
    start() {},
    reset() {},
    update() {
      return undefined;
    },
    stop() {
      throw failure;
    },
  };
  const element = document.createElement('aside');
  document.body.append(element);
  const view: StatsView = {
    show() {},
    hide() {},
    clearHistory() {},
    update() {},
    destroy() {
      element.remove();
    },
  };
  const stats = createStatsLifecycle(sampler, view);
  expect(() => stats.destroy()).toThrow(failure);
  expect(element.isConnected).toBe(false);
  expect(runtime.updates.size).toBe(0);
  expect(runtime.visibility.size).toBe(0);
  expect(() => stats.destroy()).not.toThrow();
});

it('preserves startup and rollback errors while removing the failed instance', () => {
  const startup = new Error('Source startup failed');
  const rollback = new Error('Source rollback failed');
  const stop = vi.fn<StatsSampler['stop']>().mockImplementationOnce(() => {
    throw rollback;
  });
  const sampler: StatsSampler = {
    start() {
      throw startup;
    },
    stop,
    reset() {},
    update() {
      return undefined;
    },
  };
  const destroy = vi.fn<StatsView['destroy']>();
  const view: StatsView = {
    show() {},
    hide() {},
    clearHistory() {},
    update() {},
    destroy,
  };
  expect(() => createStatsLifecycle(sampler, view)).toThrow(
    expect.objectContaining({ errors: [startup, rollback], cause: startup }),
  );
  expect(destroy).toHaveBeenCalledOnce();
  expect(runtime.updates.size).toBe(0);
  expect(runtime.visibility.size).toBe(0);
});

it.each(['show', 'visibility'] as const)(
  'rolls back a failed %s and permits a direct retry without hide',
  (trigger) => {
    const sampler: StatsSampler = {
      start: vi.fn<StatsSampler['start']>(),
      stop: vi.fn<StatsSampler['stop']>(),
      reset: vi.fn<StatsSampler['reset']>(),
      update: vi.fn<StatsSampler['update']>(),
    };
    const show = vi.fn<StatsView['show']>();
    const view: StatsView = {
      show,
      hide: vi.fn<StatsView['hide']>(),
      destroy: vi.fn<StatsView['destroy']>(),
      update: vi.fn<StatsView['update']>(),
      clearHistory: vi.fn<StatsView['clearHistory']>(),
    };
    const stats = createStatsLifecycle(sampler, view);
    controls.push(stats);
    if (trigger === 'show') {
      stats.hide();
    } else {
      setVisible(false);
    }
    // Fail after resources were acquired, not merely before startup began.
    show.mockImplementationOnce(() => {
      throw new Error('Mount failed');
    });
    const resume = trigger === 'show' ? () => stats.show() : () => setVisible(true);
    expect(resume).toThrow('Mount failed');
    expect(runtime.updates.size).toBe(0);
    expect(sampler.stop).toHaveBeenCalledTimes(2);
    stats.show();
    expect(runtime.updates.size).toBe(1);
    expect(sampler.start).toHaveBeenCalledTimes(3);
  },
);

it('renders current-frame WebGL averages and releases all wrappers on hide', () => {
  runtime.stats = {
    display: 'expanded',
    fps: false,
    frameInterval: false,
    jsHeap: false,
    drawCalls: true,
    textureBinds: true,
    programUses: true,
  };
  vi.stubGlobal('WebGLRenderingContext', Object);
  const drawArrays = vi.fn<WebGLRenderingContext['drawArrays']>();
  const context = Object.assign(new WebGLRenderingContext(), {
    canvas: document.createElement('canvas'),
    drawArrays,
    bindTexture: vi.fn<WebGLRenderingContext['bindTexture']>(),
    useProgram: vi.fn<WebGLRenderingContext['useProgram']>(),
    getExtension: vi.fn<() => null>(() => null),
    isContextLost: vi.fn<() => boolean>(() => false),
  });
  const unregister = registerWebglContext(context);
  const stats = start();
  try {
    for (const [timestamp, count] of [
      [0, 0],
      [250, 3],
      [500, 6],
    ] as const) {
      frame(timestamp, () => {
        for (let index = 0; index < count; index += 1) {
          context.drawArrays(4, 0, 3);
        }
        context.bindTexture(3553, null);
        context.useProgram(null);
      });
    }
    expect(
      document.querySelector('[data-label="Draw calls"] .replayable-stats__value')?.textContent,
    ).toBe('3.0');
    expect(
      document.querySelector('[data-label="Draw calls"] .replayable-stats__range')?.textContent,
    ).toBe('(0–6)');
    expect(
      document.querySelector('[data-label="Texture binds"] .replayable-stats__value')?.textContent,
    ).toBe('1.0');
    stats.hide();
    expect(context.drawArrays).toBe(drawArrays);
    expect(runtime.updates.size).toBe(0);
    stats.show();
    frame(1000);
    frame(1500);
    expect(
      document.querySelector('[data-label="Draw calls"] .replayable-stats__value')?.textContent,
    ).toBe('0.0');
  } finally {
    stats.destroy();
    unregister();
  }
});

it('does not inspect a registered context when only CPU metrics are enabled', () => {
  vi.stubGlobal('WebGLRenderingContext', Object);
  // Intentionally lacks GL methods: CPU-only stats must not touch this identity.
  const context = new WebGLRenderingContext();
  const unregister = registerWebglContext(context);
  try {
    const stats = start();
    frame(0);
    frame(500);
    expect(runtime.updates.size).toBe(1);
    stats.destroy();
  } finally {
    unregister();
  }
});

it("keeps two stats views synchronized and releases only the hidden view's ownership", () => {
  // Instances start at slightly different wall-clock times, but runtime supplies
  // one shared post-render timestamp and WebGL snapshot to both.
  let clockRead = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now + ++clockRead / 1000);
  runtime.stats = {
    display: 'expanded',
    fps: false,
    frameInterval: false,
    jsHeap: false,
    drawCalls: true,
    textureBinds: false,
    programUses: false,
  };
  vi.stubGlobal('WebGLRenderingContext', Object);
  const drawArrays = vi.fn<WebGLRenderingContext['drawArrays']>();
  const context = Object.assign(new WebGLRenderingContext(), {
    canvas: document.createElement('canvas'),
    drawArrays,
    getExtension: vi.fn<() => null>(() => null),
    isContextLost: vi.fn<() => boolean>(() => false),
  });
  const unregister = registerWebglContext(context);
  const first = start();
  const second = start();
  try {
    frame(0, () => context.drawArrays(4, 0, 3));
    frame(501, () => context.drawArrays(4, 0, 3));
    const values = [
      ...document.querySelectorAll('[data-label="Draw calls"] .replayable-stats__value'),
    ];
    expect(values.map((element) => element.textContent)).toEqual(['1.0', '1.0']);
    first.hide();
    expect(context.drawArrays).not.toBe(drawArrays);
    first.show();
    frame(1000, () => context.drawArrays(4, 0, 3));
    frame(1501, () => context.drawArrays(4, 0, 3));
    expect(values.map((element) => element.textContent)).toEqual(['1.0', '1.0']);
    first.destroy();
    expect(context.drawArrays).not.toBe(drawArrays);
    second.destroy();
    expect(context.drawArrays).toBe(drawArrays);
    expect(runtime.updates.size).toBe(0);
  } finally {
    first.destroy();
    second.destroy();
    unregister();
  }
});

it('returns shared inert controls for disabled or empty stats', () => {
  runtime.stats = false;
  const disabled = start();
  runtime.stats = {
    display: 'expanded',
    fps: false,
    frameInterval: false,
    jsHeap: false,
    drawCalls: false,
    textureBinds: false,
    programUses: false,
  };
  expect(start()).toBe(disabled);
  disabled.show();
  disabled.hide();
  expect(document.querySelector('.replayable-stats')).toBeNull();
});

it('samples before refreshing and restarts without hidden time', () => {
  const stats = start();
  expect(runtime.updates.size).toBe(1);
  frame(0);
  frame(250);
  frame(500);
  expect(document.querySelector('[data-label="FPS"] .replayable-stats__value')?.textContent).toBe(
    '4.0',
  );
  stats.hide();
  stats.hide();
  expect(runtime.updates.size).toBe(0);
  frame(10_000);
  stats.show();
  stats.show();
  expect(runtime.updates.size).toBe(1);
  frame(10_000);
  frame(10_250);
  frame(10_500);
  expect(document.querySelector('[data-label="FPS"] .replayable-stats__value')?.textContent).toBe(
    '4.0',
  );
});

it('preserves manual hide through host visibility changes', () => {
  const stats = start();
  setVisible(false);
  expect(runtime.updates.size).toBe(0);
  setVisible(true);
  expect(runtime.updates.size).toBe(1);
  stats.hide();
  setVisible(false);
  setVisible(true);
  expect(runtime.updates.size).toBe(0);
  expect(document.querySelector('.replayable-stats')?.hasAttribute('hidden')).toBe(true);
});

it('waits while initially invisible and makes destroyed controls inert', () => {
  runtime.visible = false;
  const stats = start();
  expect(runtime.updates.size).toBe(0);
  setVisible(true);
  const pendingUpdates = [...runtime.updates];
  stats.destroy();
  stats.destroy();
  stats.show();
  stats.hide();
  setVisible(true);
  now = 1000;
  for (const listener of pendingUpdates) {
    listener({ timestamp: now });
  }
  expect(document.querySelector('.replayable-stats')).toBeNull();
  expect(runtime.updates.size).toBe(0);
  expect(runtime.visibility.size).toBe(0);
});

it('preserves compact selection but clears traces across host visibility gaps', () => {
  runtime.stats = {
    display: 'compact',
    fps: true,
    frameInterval: true,
    jsHeap: false,
    drawCalls: false,
    textureBinds: false,
    programUses: false,
  };
  start();
  frame(0);
  frame(500);
  frame(1000);
  const shell = document.querySelector('.replayable-stats');
  if (!(shell instanceof HTMLElement)) {
    throw new Error('Missing stats shell');
  }
  shell.click();
  const selected = document.querySelector('[data-label="Frame · ms"]');
  expect(selected?.hasAttribute('hidden')).toBe(false);
  expect(selected?.querySelector('path[d]')).not.toBeNull();
  const range = selected?.querySelector('.replayable-stats__range')?.textContent;
  expect(range).toBe('(500–500)');
  setVisible(false);
  expect(runtime.updates.size).toBe(0);
  frame(10_000);
  setVisible(true);
  expect(selected?.hasAttribute('hidden')).toBe(false);
  expect(selected?.querySelector('path[d]')).toBeNull();
  expect(selected?.querySelector('.replayable-stats__range')?.textContent).toBe(range);
  frame(10_000);
  frame(10_500);
  expect(selected?.querySelector('.replayable-stats__value')?.textContent).toBe('500.0');
  expect(selected?.querySelector('path[d]')).toBeNull();
});
