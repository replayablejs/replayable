import { playable } from '@replayablejs/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { REPLAYABLE_CANVAS_ID } from '../src/host/canvas-ids.js';
import { getCanvasHost } from '../src/host/get-canvas-host.js';
import { registerWebglContext, unregisterContext } from './webgl-stats.js';

beforeEach(() => {
  // The host hands off context identities; it never calls WebGL methods.
  vi.stubGlobal('WebGLRenderingContext', Object);
  registerWebglContext.mockReset().mockImplementation(() => unregisterContext);
  unregisterContext.mockReset();
});

afterEach(() => {
  getCanvasHost().destroy();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('shared canvas host', () => {
  it('registers the renderer context once and releases it once on destruction', () => {
    const host = getCanvasHost();
    const context = new WebGLRenderingContext();
    const getContext = vi.spyOn(host.getCanvas(), 'getContext');

    host.setSharedContext(context);
    host.setSharedContext(context);
    expect(registerWebglContext).toHaveBeenCalledExactlyOnceWith(context);
    expect(getContext).not.toHaveBeenCalled();

    expect(() => host.setSharedContext(new WebGLRenderingContext())).toThrow(
      'Replayable canvas already has a different WebGL context.',
    );
    expect(registerWebglContext).toHaveBeenCalledTimes(1);
    host.destroy();
    host.destroy();
    expect(unregisterContext).toHaveBeenCalledTimes(1);
    getContext.mockRestore();
  });
  it('installs canvas css once across host recreation', () => {
    getCanvasHost().destroy();
    getCanvasHost();

    expect(document.head.querySelectorAll('#replayable-canvas-styles')).toHaveLength(1);
  });

  it('returns one shared canvas host', () => {
    expect(getCanvasHost()).toBe(getCanvasHost());
  });

  it('creates and appends a canvas to the container', () => {
    const host = getCanvasHost();

    expect(playable.container.contains(host.getCanvas())).toBe(true);
    expect(host.getCanvas().tagName).toBe('CANVAS');
    expect(host.getCanvas().id).toBe(REPLAYABLE_CANVAS_ID);
  });

  it('tracks shared context independently from context creation', () => {
    const host = getCanvasHost();
    const context = new WebGLRenderingContext();

    expect(host.getSharedContext()).toBeNull();

    host.setSharedContext(context);
    expect(host.getSharedContext()).toBe(context);

    host.setSharedContext(context);
    expect(host.getSharedContext()).toBe(context);
  });

  it('rejects replacement with a different WebGL context', () => {
    const host = getCanvasHost();
    const context = new WebGLRenderingContext();
    const differentContext = new WebGLRenderingContext();

    host.setSharedContext(context);

    expect(() => {
      host.setSharedContext(differentContext);
    }).toThrow('Replayable canvas already has a different WebGL context.');
  });

  it('creates a fresh shared host after destruction', () => {
    const host = getCanvasHost();
    const canvas = host.getCanvas();

    host.destroy();

    const replacementHost = getCanvasHost();

    expect(playable.container.contains(canvas)).toBe(false);
    expect(replacementHost).not.toBe(host);
    expect(replacementHost.getCanvas()).not.toBe(canvas);
    expect(playable.container.contains(replacementHost.getCanvas())).toBe(true);
  });

  it('leaves registration retryable when the observer rejects it', () => {
    const host = getCanvasHost();
    const context = new WebGLRenderingContext();
    const failure = new Error('registration failed');
    registerWebglContext.mockImplementationOnce(() => {
      throw failure;
    });

    expect(() => host.setSharedContext(context)).toThrow(failure);
    expect(host.getSharedContext()).toBeNull();
    host.setSharedContext(context);
    expect(registerWebglContext).toHaveBeenCalledTimes(2);
    expect(host.getSharedContext()).toBe(context);
    host.destroy();
    expect(unregisterContext).toHaveBeenCalledOnce();
  });

  it('finishes destruction even when observer cleanup throws', () => {
    const host = getCanvasHost();
    host.setSharedContext(new WebGLRenderingContext());
    const failure = new Error('cleanup failed');
    unregisterContext.mockImplementationOnce(() => {
      throw failure;
    });

    expect(() => host.destroy()).toThrow(failure);
    expect(host.getSharedContext()).toBeNull();
    expect(playable.container.contains(host.getCanvas())).toBe(false);
    const replacement = getCanvasHost();
    expect(replacement).not.toBe(host);
    host.destroy();
    expect(getCanvasHost()).toBe(replacement);
    expect(unregisterContext).toHaveBeenCalledOnce();
  });

  it('rejects registration on an obsolete host without affecting its replacement', () => {
    const host = getCanvasHost();
    host.destroy();
    const replacement = getCanvasHost();

    expect(() => host.setSharedContext(new WebGLRenderingContext())).toThrow(
      'Cannot register a WebGL context on a destroyed Replayable canvas host.',
    );
    expect(registerWebglContext).not.toHaveBeenCalled();
    expect(getCanvasHost()).toBe(replacement);
    expect(host.getSharedContext()).toBeNull();
  });

  it('does not let an obsolete host release its replacement', () => {
    const obsoleteHost = getCanvasHost();
    obsoleteHost.destroy();

    const currentHost = getCanvasHost();
    obsoleteHost.destroy();

    expect(getCanvasHost()).toBe(currentHost);
  });
});
