import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  registerWebglContext,
  subscribeWebglContexts,
} from '../src/stats/webgl/context-registry.js';
import type { StatsWebglContextListener } from '../src/types/webgl.js';

const cleanup: (() => void)[] = [];

beforeEach(() => {
  // Registration uses identity only. No browser or WebGL methods are needed.
  vi.stubGlobal('WebGLRenderingContext', Object);
});

afterEach(() => {
  for (const release of cleanup.reverse()) {
    release();
  }
  cleanup.length = 0;
  vi.unstubAllGlobals();
});

it('notifies early observers when a renderer registers and releases its context', () => {
  const observer = vi.fn<StatsWebglContextListener>();
  cleanup.push(subscribeWebglContexts(observer));
  const context = new WebGLRenderingContext();
  const release = registerWebglContext(context);
  cleanup.push(release);
  release();
  release();
  expect(observer.mock.calls).toEqual([[[]], [[context]], [[]]]);
});

it('replays existing contexts to late observers and stops notifications on unsubscribe', () => {
  const context = new WebGLRenderingContext();
  const release = registerWebglContext(context);
  cleanup.push(release);
  const observer = vi.fn<StatsWebglContextListener>();
  const unsubscribe = subscribeWebglContexts(observer);
  cleanup.push(unsubscribe);
  expect(observer).toHaveBeenCalledExactlyOnceWith([context]);
  unsubscribe();
  release();
  expect(observer).toHaveBeenCalledTimes(1);
});

it('reports a shared context once and removes it only after the last owner releases it', () => {
  const observer = vi.fn<StatsWebglContextListener>();
  cleanup.push(subscribeWebglContexts(observer));
  const context = new WebGLRenderingContext();
  const first = registerWebglContext(context);
  const second = registerWebglContext(context);
  cleanup.push(first, second);
  first();
  expect(observer.mock.calls).toEqual([[[]], [[context]]]);
  second();
  expect(observer.mock.calls).toEqual([[[]], [[context]], [[]]]);
});

it('keeps snapshots immutable and does not let stale cleanup remove a replacement', () => {
  const observer = vi.fn<StatsWebglContextListener>();
  cleanup.push(subscribeWebglContexts(observer));
  const firstContext = new WebGLRenderingContext();
  const first = registerWebglContext(firstContext);
  cleanup.push(first);
  first();
  const replacement = new WebGLRenderingContext();
  cleanup.push(registerWebglContext(replacement));
  first();
  expect(observer).toHaveBeenLastCalledWith([replacement]);
  const snapshot = observer.mock.calls[1]?.[0];
  expect(snapshot).toEqual([firstContext]);
  expect(Object.isFrozen(snapshot)).toBe(true);
});

it('rolls back failed registration and notifies successful observers of the rollback', () => {
  const context = new WebGLRenderingContext();
  const observer = vi.fn<StatsWebglContextListener>();
  cleanup.push(subscribeWebglContexts(observer));
  const fail = subscribeWebglContexts((contexts) => {
    if (contexts.includes(context)) {
      throw new Error('Observer failed');
    }
  });
  cleanup.push(fail);
  expect(() => registerWebglContext(context)).toThrow(AggregateError);
  expect(observer.mock.calls).toEqual([[[]], [[context]], [[]]]);
  const current = vi.fn<StatsWebglContextListener>();
  cleanup.push(subscribeWebglContexts(current));
  expect(current).toHaveBeenLastCalledWith([]);
  fail();
  const release = registerWebglContext(context);
  cleanup.push(release);
  release();
  expect(current).toHaveBeenLastCalledWith([]);
});

it('does not skip later observers when removal notification fails', () => {
  const context = new WebGLRenderingContext();
  const release = registerWebglContext(context);
  cleanup.push(release);
  const fail = subscribeWebglContexts((contexts) => {
    if (contexts.length === 0) {
      throw new Error('Removal observer failed');
    }
  });
  cleanup.push(fail);
  const observer = vi.fn<StatsWebglContextListener>();
  cleanup.push(subscribeWebglContexts(observer));
  expect(release).toThrow(AggregateError);
  expect(observer).toHaveBeenLastCalledWith([]);
  fail();
  release();
});
