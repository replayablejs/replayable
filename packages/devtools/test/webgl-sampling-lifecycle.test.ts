import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { registerWebglContext } from '../src/stats/webgl/context-registry.js';
import {
  collectWebglFrame,
  subscribeWebglFrames,
} from '../src/stats/webgl/subscribe-webgl-frames.js';
import type { StatsWebglFrameListener } from '../src/types/webgl.js';

const runtime = vi.hoisted(() => ({
  visible: true,
  updates: new Set<() => void>(),
  visibility: new Set<(visible: boolean) => void>(),
}));
vi.mock('@replayablejs/runtime', () => ({
  playable: {
    get state() {
      return { visible: runtime.visible };
    },
    update: {
      add(listener: () => void) {
        runtime.updates.add(listener);
        return () => {
          runtime.updates.delete(listener);
        };
      },
    },
    on(_event: string, listener: (visible: boolean) => void) {
      runtime.visibility.add(listener);
      return () => {
        runtime.visibility.delete(listener);
      };
    },
  },
}));

const cleanup: (() => void)[] = [];
let frameTimestamp = 0;
beforeEach(() => {
  frameTimestamp = 0;
  runtime.visible = true;
  vi.stubGlobal('WebGLRenderingContext', Object);
});
afterEach(() => {
  for (const release of cleanup.reverse()) {
    release();
  }
  cleanup.length = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function createContext() {
  const canvas = new EventTarget();
  const draw = vi.fn<WebGLRenderingContext['drawArrays']>();
  const lost = vi.fn<() => boolean>(() => false);
  const context = Object.assign(new WebGLRenderingContext(), {
    canvas,
    drawArrays: draw,
    isContextLost: lost,
    getExtension: vi.fn<() => null>(() => null),
  });
  return { context, canvas, draw, lost };
}

function sample(draw: () => void = () => {}): void {
  draw();
  collectWebglFrame(++frameTimestamp);
}

it('releases all contexts after one restoration fails and permits a fresh subscription', () => {
  const first = createContext();
  const second = createContext();
  const unregisterFirst = registerWebglContext(first.context);
  const unregisterSecond = registerWebglContext(second.context);
  cleanup.push(unregisterFirst, unregisterSecond);
  const release = subscribeWebglFrames(() => {});
  Object.defineProperty(first.context, 'drawArrays', { configurable: false });

  expect(release).toThrow(TypeError);
  expect(second.context.drawArrays).toBe(second.draw);
  expect(release).not.toThrow();

  unregisterFirst();
  const listener = vi.fn<StatsWebglFrameListener>();
  const releaseNext = subscribeWebglFrames(listener);
  cleanup.push(releaseNext);
  sample(() => second.context.drawArrays(4, 0, 3));
  expect(listener.mock.calls[0]?.[1]?.drawCalls).toBe(1);
});

it('shares one snapshot and releases instrumentation only after the last consumer', () => {
  const { context, draw } = createContext();
  cleanup.push(registerWebglContext(context));
  const first = vi.fn<StatsWebglFrameListener>();
  const second = vi.fn<StatsWebglFrameListener>();
  const releaseFirst = subscribeWebglFrames(first);
  const releaseSecond = subscribeWebglFrames(second);
  cleanup.push(releaseFirst, releaseSecond);
  expect(runtime.updates.size).toBe(0);
  sample(() => context.drawArrays(4, 0, 3));
  expect(first.mock.calls[0]?.[1]?.drawCalls).toBe(1);
  expect(second.mock.calls[0]?.[1]).toBe(first.mock.calls[0]?.[1]);
  expect(Object.isFrozen(first.mock.calls[0]?.[1])).toBe(true);
  releaseFirst();
  expect(context.drawArrays).not.toBe(draw);
  releaseSecond();
  expect(context.drawArrays).toBe(draw);
  expect(runtime.updates.size).toBe(0);
  expect(runtime.visibility.size).toBe(0);
});

it('supports late registration, context removal, and unavailable versus idle frames', () => {
  const listener = vi.fn<StatsWebglFrameListener>();
  cleanup.push(subscribeWebglFrames(listener));
  sample();
  expect(listener.mock.calls[0]?.[1]).toBeUndefined();
  const { context, draw } = createContext();
  const unregister = registerWebglContext(context);
  cleanup.push(unregister);
  sample();
  expect(listener.mock.calls[1]?.[1]).toEqual({ drawCalls: 0, textureBinds: 0, programUses: 0 });
  unregister();
  sample();
  expect(listener.mock.calls[2]?.[1]).toBeUndefined();
  expect(context.drawArrays).toBe(draw);
});

it('collects once per shared frame identity without owning an update subscription', () => {
  const { context } = createContext();
  cleanup.push(registerWebglContext(context));
  const listener = vi.fn<StatsWebglFrameListener>();
  cleanup.push(subscribeWebglFrames(listener));
  context.drawArrays(4, 0, 3);
  collectWebglFrame(100);
  collectWebglFrame(100);
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener.mock.calls[0]?.[1]?.drawCalls).toBe(1);
  collectWebglFrame(116);
  expect(listener.mock.calls[1]?.[1]?.drawCalls).toBe(0);
  expect(runtime.updates.size).toBe(0);
});

it('does not deliver a snapshot to a consumer released by an earlier callback', () => {
  const second = vi.fn<StatsWebglFrameListener>();
  let releaseSecond = (): void => {};
  cleanup.push(subscribeWebglFrames(() => releaseSecond()));
  releaseSecond = subscribeWebglFrames(second);
  cleanup.push(releaseSecond);
  sample();
  expect(second).not.toHaveBeenCalled();
});

it('keeps initially lost contexts unavailable until restored and removes event listeners', () => {
  const { context, canvas, draw, lost } = createContext();
  lost.mockReturnValue(true);
  const add = vi.spyOn(canvas, 'addEventListener');
  const remove = vi.spyOn(canvas, 'removeEventListener');
  const unregister = registerWebglContext(context);
  cleanup.push(unregister);
  const listener = vi.fn<StatsWebglFrameListener>();
  cleanup.push(subscribeWebglFrames(listener));
  expect(context.drawArrays).toBe(draw);
  sample();
  expect(listener.mock.calls[0]?.[1]).toBeUndefined();
  lost.mockReturnValue(false);
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  sample();
  expect(listener.mock.calls[1]?.[1]?.drawCalls).toBe(0);
  unregister();
  expect(remove.mock.calls).toEqual(add.mock.calls);
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  expect(context.drawArrays).toBe(draw);
});

it('sums distinct contexts once even when the same context has multiple registrations', () => {
  const first = createContext();
  const second = createContext();
  cleanup.push(
    registerWebglContext(first.context),
    registerWebglContext(first.context),
    registerWebglContext(second.context),
  );
  const listener = vi.fn<StatsWebglFrameListener>();
  cleanup.push(subscribeWebglFrames(listener));
  sample(() => {
    first.context.drawArrays(4, 0, 3);
    second.context.drawArrays(4, 0, 3);
  });
  expect(listener.mock.calls[0]?.[1]?.drawCalls).toBe(2);
});

it('cleans up a failed initial acquisition and allows a later subscription', () => {
  const { context, draw } = createContext();
  Object.defineProperty(context, 'drawArrays', { configurable: false });
  const unregister = registerWebglContext(context);
  cleanup.push(unregister);
  expect(() => subscribeWebglFrames(vi.fn<StatsWebglFrameListener>())).toThrow(TypeError);
  expect(runtime.visibility.size).toBe(0);
  expect(runtime.updates.size).toBe(0);
  expect(context.drawArrays).toBe(draw);
  unregister();
  const listener = vi.fn<StatsWebglFrameListener>();
  const release = subscribeWebglFrames(listener);
  cleanup.push(release);
  release();
  sample();
  expect(listener).not.toHaveBeenCalled();
});

it('ignores collection after release and discards partial work before reacquisition', () => {
  const { context, draw } = createContext();
  cleanup.push(registerWebglContext(context));
  const listener = vi.fn<StatsWebglFrameListener>();
  const release = subscribeWebglFrames(listener);
  cleanup.push(release);
  context.drawArrays(4, 0, 3);
  release();
  sample();
  expect(listener).not.toHaveBeenCalled();
  expect(context.drawArrays).toBe(draw);
  context.drawArrays(4, 0, 3);
  cleanup.push(subscribeWebglFrames(listener));
  sample();
  expect(listener.mock.calls[0]?.[1]?.drawCalls).toBe(0);
});

it('leaves visibility decisions to the subscriber and releases on request', () => {
  runtime.visible = false;
  const { context, draw } = createContext();
  cleanup.push(registerWebglContext(context));
  const release = subscribeWebglFrames(vi.fn<StatsWebglFrameListener>());
  cleanup.push(release);
  expect(context.drawArrays).not.toBe(draw);
  expect(runtime.visibility.size).toBe(0);
  expect(runtime.updates.size).toBe(0);
  release();
  expect(context.drawArrays).toBe(draw);
  expect(runtime.updates.size).toBe(0);
});

it('discards lost-context counters and reacquires on restoration without preventing the event', () => {
  const { context, canvas, draw, lost } = createContext();
  cleanup.push(registerWebglContext(context));
  const listener = vi.fn<StatsWebglFrameListener>();
  const release = subscribeWebglFrames(listener);
  cleanup.push(release);
  context.drawArrays(4, 0, 3);
  lost.mockReturnValue(true);
  const event = new Event('webglcontextlost', { cancelable: true });
  canvas.dispatchEvent(event);
  sample();
  expect(event.defaultPrevented).toBe(false);
  expect(context.drawArrays).toBe(draw);
  expect(listener.mock.calls[0]?.[1]).toBeUndefined();
  lost.mockReturnValue(false);
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  sample(() => context.drawArrays(4, 0, 3));
  expect(listener.mock.calls[1]?.[1]?.drawCalls).toBe(1);
  release();
  canvas.dispatchEvent(new Event('webglcontextrestored'));
  expect(context.drawArrays).toBe(draw);
});
