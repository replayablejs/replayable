import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createWebglTracker } from '../src/stats/webgl/create-webgl-tracker.js';
import { observeWebglMethod } from '../src/stats/webgl/observe-webgl-method.js';

const cleanup: (() => void)[] = [];

beforeEach(() => {
  // Typed identity fixture, not a real GL context: no GPU/browser is needed.
  vi.stubGlobal('WebGL2RenderingContext', Object);
});

afterEach(() => {
  for (const release of cleanup.reverse()) {
    release();
  }
  cleanup.length = 0;
  vi.unstubAllGlobals();
});

function createContext(): WebGL2RenderingContext {
  return Object.assign(new WebGL2RenderingContext(), {
    drawArrays: vi.fn<WebGL2RenderingContext['drawArrays']>(),
    drawElements: vi.fn<WebGL2RenderingContext['drawElements']>(),
    drawRangeElements: vi.fn<WebGL2RenderingContext['drawRangeElements']>(),
    drawArraysInstanced: vi.fn<WebGL2RenderingContext['drawArraysInstanced']>(),
    drawElementsInstanced: vi.fn<WebGL2RenderingContext['drawElementsInstanced']>(),
    bindTexture: vi.fn<WebGL2RenderingContext['bindTexture']>(),
    useProgram: vi.fn<WebGL2RenderingContext['useProgram']>(),
    getExtension: vi.fn<() => null>().mockReturnValue(null),
  });
}

it('disables every wrapper even when another tool prevents one descriptor from being restored', () => {
  const context = createContext();
  const originalDraw = Object.getOwnPropertyDescriptor(context, 'drawArrays');
  const tracker = createWebglTracker(context);
  Object.defineProperty(context, 'useProgram', { configurable: false });

  expect(tracker.destroy).toThrow(TypeError);
  expect(Object.getOwnPropertyDescriptor(context, 'drawArrays')).toEqual(originalDraw);
  context.drawArrays(4, 0, 3);
  context.useProgram(null);
  expect(tracker.collect()).toEqual({ drawCalls: 0, textureBinds: 0, programUses: 0 });
  expect(tracker.destroy).not.toThrow();
});

it('reports an undeletable inherited shadow but makes retained wrappers inert', () => {
  const prototype = { method: vi.fn<() => void>() };
  const target: object = Object.create(prototype);
  const observe = vi.fn<() => void>();
  const restore = observeWebglMethod(target, 'method', observe);
  Object.defineProperty(target, 'method', { configurable: false });
  expect(restore).toThrow('Unable to remove the stats wrapper');
  const method: unknown = Reflect.get(target, 'method');
  if (typeof method !== 'function') {
    throw new Error('Missing wrapper');
  }
  Reflect.apply(method, target, []);
  expect(observe).not.toHaveBeenCalled();
  expect(restore).not.toThrow();
});

it('counts all core draws once, including instancing, and counts repeated/null bindings', () => {
  const context = createContext();
  const tracker = createWebglTracker(context);
  cleanup.push(tracker.destroy);
  context.drawArrays(4, 0, 3);
  context.drawElements(4, 3, 5123, 0);
  context.drawRangeElements(4, 0, 2, 3, 5123, 0);
  context.drawArraysInstanced(4, 0, 3, 100);
  context.drawElementsInstanced(4, 3, 5123, 0, 200);
  context.bindTexture(3553, null);
  context.bindTexture(3553, null);
  context.useProgram(null);
  context.useProgram(null);
  expect(tracker.collect()).toEqual({ drawCalls: 5, textureBinds: 2, programUses: 2 });
  expect(tracker.collect()).toEqual({ drawCalls: 0, textureBinds: 0, programUses: 0 });
});

it('reuses one tracker for a shared context and permits replacement after destruction', () => {
  const context = createContext();
  const first = createWebglTracker(context);
  expect(createWebglTracker(context)).toBe(first);
  context.drawArrays(4, 0, 3);
  expect(first.collect().drawCalls).toBe(1);
  first.destroy();
  const replacement = createWebglTracker(context);
  cleanup.push(replacement.destroy);
  first.destroy();
  expect(createWebglTracker(context)).toBe(replacement);
  context.drawArrays(4, 0, 3);
  expect(replacement.collect().drawCalls).toBe(1);
});

it('discards partial counters and leaves other contexts untouched', () => {
  const context = createContext();
  const other = createContext();
  const tracker = createWebglTracker(context);
  cleanup.push(tracker.destroy);
  context.drawArrays(4, 0, 3);
  tracker.reset();
  other.drawArrays(4, 0, 3);
  expect(tracker.collect().drawCalls).toBe(0);
});

it('tracks cached ANGLE and all four multi-draw methods by submitted drawcount', () => {
  const instancing = {
    drawArraysInstancedANGLE: vi.fn<ANGLE_instanced_arrays['drawArraysInstancedANGLE']>(),
    drawElementsInstancedANGLE: vi.fn<ANGLE_instanced_arrays['drawElementsInstancedANGLE']>(),
  };
  const multiDraw = {
    multiDrawArraysWEBGL: vi.fn<(...args: unknown[]) => void>(),
    multiDrawElementsWEBGL: vi.fn<(...args: unknown[]) => void>(),
    multiDrawArraysInstancedWEBGL: vi.fn<(...args: unknown[]) => void>(),
    multiDrawElementsInstancedWEBGL: vi.fn<(...args: unknown[]) => void>(),
  };
  const context = createContext();
  Object.defineProperty(context, 'getExtension', {
    value: vi.fn<(name: string) => object>((name) =>
      name === 'ANGLE_instanced_arrays' ? instancing : multiDraw,
    ),
  });
  const tracker = createWebglTracker(context);
  cleanup.push(tracker.destroy);
  instancing.drawArraysInstancedANGLE(4, 0, 3, 100);
  instancing.drawElementsInstancedANGLE(4, 3, 5123, 0, 100);
  multiDraw.multiDrawArraysWEBGL(4, [], 0, [], 0, 2);
  multiDraw.multiDrawElementsWEBGL(4, [], 0, 5123, [], 0, 3);
  multiDraw.multiDrawArraysInstancedWEBGL(4, [], 0, [], 0, [], 0, 4);
  multiDraw.multiDrawElementsInstancedWEBGL(4, [], 0, 5123, [], 0, [], 0, 5);
  multiDraw.multiDrawArraysWEBGL(4, [], 0, [], 0, 0);
  multiDraw.multiDrawArraysWEBGL(4, [], 0, [], 0, 2, 100);
  expect(tracker.collect().drawCalls).toBe(18);
  tracker.destroy();
  instancing.drawArraysInstancedANGLE(4, 0, 3, 100);
  multiDraw.multiDrawArraysWEBGL(4, [], 0, [], 0, 2);
  expect(tracker.collect().drawCalls).toBe(0);
});

it('supports WebGL1 without optional WebGL2 methods or extensions', () => {
  const context = createContext();
  Reflect.deleteProperty(context, 'drawRangeElements');
  Reflect.deleteProperty(context, 'drawArraysInstanced');
  Reflect.deleteProperty(context, 'drawElementsInstanced');
  const tracker = createWebglTracker(context);
  cleanup.push(tracker.destroy);
  context.drawArrays(4, 0, 3);
  context.drawElements(4, 3, 5123, 0);
  expect(tracker.collect().drawCalls).toBe(2);
  expect(Object.hasOwn(context, 'drawArraysInstanced')).toBe(false);
});

it('preserves method receiver, argument identities, result, and exceptions', () => {
  const result = {};
  const argument = {};
  const original = vi.fn<(this: unknown, value: unknown) => object>(function (
    this: unknown,
    value: unknown,
  ) {
    return { receiver: this, value, result };
  });
  const target = { method: original };
  const observe = vi.fn<(args: readonly unknown[]) => void>();
  cleanup.push(observeWebglMethod(target, 'method', observe));
  expect(target.method(argument)).toEqual({ receiver: target, value: argument, result });
  expect(original).toHaveBeenCalledExactlyOnceWith(argument);
  expect(observe).toHaveBeenCalledExactlyOnceWith([argument]);
  const error = new Error('Native failure');
  original.mockImplementationOnce(() => {
    throw error;
  });
  expect(() => target.method(argument)).toThrow(error);
  expect(observe).toHaveBeenCalledTimes(1);
});

it('restores own descriptors and removes shadows without modifying prototypes', () => {
  const prototype = { method: vi.fn<() => void>() };
  const inherited: object = Object.create(prototype);
  const restoreInherited = observeWebglMethod(inherited, 'method', vi.fn<() => void>());
  expect(Object.hasOwn(inherited, 'method')).toBe(true);
  restoreInherited();
  expect(Object.hasOwn(inherited, 'method')).toBe(false);
  expect(Reflect.get(inherited, 'method')).toBe(prototype.method);
  const own = { method: vi.fn<() => void>() };
  const descriptor = Object.getOwnPropertyDescriptor(own, 'method');
  const restoreOwn = observeWebglMethod(own, 'method', vi.fn<() => void>());
  restoreOwn();
  restoreOwn();
  expect(Object.getOwnPropertyDescriptor(own, 'method')).toEqual(descriptor);
});

it('does not overwrite later instrumentation and disables retained wrappers', () => {
  const target = { method: vi.fn<() => void>() };
  const observe = vi.fn<() => void>();
  const restore = observeWebglMethod(target, 'method', observe);
  const retained = target.method;
  const later = vi.fn<() => void>(() => retained());
  target.method = later;
  restore();
  target.method();
  expect(target.method).toBe(later);
  expect(observe).not.toHaveBeenCalled();
});

it('rolls back earlier patches if a method cannot be instrumented', () => {
  const context = createContext();
  const original = Object.getOwnPropertyDescriptor(context, 'drawArrays');
  Object.defineProperty(context, 'bindTexture', { configurable: false });
  expect(() => createWebglTracker(context)).toThrow(TypeError);
  expect(Object.getOwnPropertyDescriptor(context, 'drawArrays')).toEqual(original);
});
