import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPixiRenderer } from '../src/renderer/create-pixi-renderer.js';

const canvas = vi.hoisted(() => ({
  context: null as object | null,
  element: {},
  getCanvas: vi.fn<() => object>(),
  getSharedContext: vi.fn<() => object | null>(),
  setSharedContext: vi.fn<(context: object) => void>(),
  destroy: vi.fn<() => void>(),
  getHost: vi.fn<() => void>(),
}));

const pixi = vi.hoisted(() => ({
  context: {} as object,
  init: vi.fn<(options: object) => Promise<void>>(),
  destroy: vi.fn<() => void>(),
  loseContext: vi.fn<() => void>(),
}));

vi.mock('@replayablejs/canvas', () => ({
  getCanvasHost: () => {
    canvas.getHost();
    return {
      getCanvas: canvas.getCanvas,
      getSharedContext: canvas.getSharedContext,
      setSharedContext: canvas.setSharedContext,
      destroy: canvas.destroy,
    };
  },
}));
vi.mock('@replayablejs/runtime', () => ({
  playable: { config: { backgroundColor: '#123456' } },
}));
vi.mock('pixi.js', () => ({
  WebGLRenderer: class {
    gl = pixi.context;
    init = pixi.init;
    context = { extensions: { loseContext: { loseContext: pixi.loseContext } } };
    destroy(): void {
      pixi.destroy();
      this.context.extensions.loseContext?.loseContext();
    }
  },
}));

class TestWebGL2RenderingContext {
  readonly mocked = true;
}

beforeEach(() => {
  vi.clearAllMocks();
  canvas.context = null;
  canvas.setSharedContext.mockReset();
  pixi.destroy.mockReset();
  vi.stubGlobal('WebGL2RenderingContext', TestWebGL2RenderingContext);
  canvas.getCanvas.mockReturnValue(canvas.element);
  canvas.getSharedContext.mockImplementation(() => canvas.context);
  pixi.init.mockResolvedValue();
  pixi.context = new TestWebGL2RenderingContext();
});
afterEach(() => vi.unstubAllGlobals());

describe('Pixi renderer', () => {
  it('creates and registers the first shared WebGL context', async () => {
    const result = await createPixiRenderer({});

    expect(pixi.init).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundAlpha: 1,
        backgroundColor: '#123456',
        canvas: canvas.element,
        clearBeforeRender: true,
        context: null,
        preferWebGLVersion: 2,
      }),
    );
    expect(canvas.setSharedContext).toHaveBeenCalledWith(pixi.context);
    result.destroy();
    result.destroy();
    expect(canvas.destroy).toHaveBeenCalledOnce();
    expect(canvas.getHost).toHaveBeenCalledOnce();
    expect(pixi.loseContext).toHaveBeenCalledOnce();
  });

  it('reuses an existing WebGL 2 context without clearing it', async () => {
    const sharedContext = new TestWebGL2RenderingContext();
    canvas.context = sharedContext;

    const result = await createPixiRenderer({});

    expect(pixi.init).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundAlpha: 0,
        clearBeforeRender: false,
        context: sharedContext,
      }),
    );
    expect(canvas.setSharedContext).not.toHaveBeenCalled();
    result.destroy();
    expect(canvas.destroy).not.toHaveBeenCalled();
    expect(pixi.loseContext).not.toHaveBeenCalled();
    expect(pixi.destroy).toHaveBeenCalledOnce();
  });

  it('cleans up when initialization rejects', async () => {
    const failure = new Error('init failed');
    pixi.init.mockRejectedValueOnce(failure);
    await expect(createPixiRenderer({})).rejects.toThrow(failure);
    expect(pixi.destroy).toHaveBeenCalledOnce();
    expect(canvas.destroy).toHaveBeenCalledOnce();
  });

  it('cleans up when registering the initialized context fails', async () => {
    const failure = new Error('registration failed');
    canvas.setSharedContext.mockImplementationOnce(() => {
      throw failure;
    });
    await expect(createPixiRenderer({})).rejects.toThrow(failure);
    expect(pixi.destroy).toHaveBeenCalledOnce();
    expect(canvas.destroy).toHaveBeenCalledOnce();
  });

  it('releases the captured host even when renderer destruction fails', async () => {
    const result = await createPixiRenderer({});
    pixi.destroy.mockImplementationOnce(() => {
      throw new Error('destroy failed');
    });
    expect(result.destroy).toThrow('destroy failed');
    expect(canvas.destroy).toHaveBeenCalledOnce();
    expect(canvas.getHost).toHaveBeenCalledOnce();
    expect(result.destroy).not.toThrow();
  });
});
