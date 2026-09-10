import { WebGLRenderer } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { synchronizePixiScreen } from '../src/renderer/synchronize-pixi-screen.js';

const runtime = vi.hoisted(() => {
  let resize: (() => void) | undefined;
  const stop = vi.fn<() => void>();
  const on = vi.fn<(event: string, listener: () => void) => () => void>((_event, listener) => {
    resize = listener;
    return stop;
  });

  return {
    playable: {
      on,
      screen: {
        frame: undefined as { height: number; width: number; x: number; y: number } | undefined,
        resolution: 2,
      },
    },
    on,
    rendererResize: vi.fn<(width: number, height: number) => void>(),
    resize: () => resize?.(),
  };
});

vi.mock('@replayablejs/runtime', () => ({ playable: runtime.playable }));
vi.mock('pixi.js', () => ({
  WebGLRenderer: class {
    canvas = { height: 0, width: 0 };
    resolution = 1;

    resize = (width: number, height: number): void => {
      runtime.rendererResize(width, height);
      this.canvas.width = Math.round(width * this.resolution);
      this.canvas.height = Math.round(height * this.resolution);
    };
  },
}));

beforeEach(() => {
  runtime.playable.screen.frame = { height: 640, width: 360, x: 0, y: 0 };
  runtime.playable.screen.resolution = 2;
  vi.clearAllMocks();
  runtime.rendererResize.mockReset();
});

describe('Pixi screen synchronization', () => {
  it('applies an already resolved screen without waiting for another resize', () => {
    const renderer = new WebGLRenderer();
    synchronizePixiScreen(renderer);
    expect(runtime.rendererResize).toHaveBeenCalledExactlyOnceWith(360, 640);
    expect(renderer.resolution).toBe(2);
  });

  it('subscribes before readiness without reading unresolved dimensions', () => {
    runtime.playable.screen.frame = undefined;
    const renderer = new WebGLRenderer();
    synchronizePixiScreen(renderer);
    expect(runtime.rendererResize).not.toHaveBeenCalled();
    runtime.playable.screen.frame = { width: 360, height: 640, x: 0, y: 0 };
    runtime.resize();
    expect(runtime.rendererResize).toHaveBeenCalledExactlyOnceWith(360, 640);
  });

  it('releases the subscription if initial synchronization fails', () => {
    runtime.rendererResize.mockImplementationOnce(() => {
      throw new Error('resize failed');
    });
    expect(() => synchronizePixiScreen(new WebGLRenderer())).toThrow('resize failed');
    expect(runtime.on.mock.results[0]?.value).toHaveBeenCalledOnce();
  });
  it('resizes the drawing buffer from Replayable screen state and releases its listener', () => {
    const renderer = new WebGLRenderer();
    const stop = synchronizePixiScreen(renderer);

    runtime.resize();

    expect(renderer.resolution).toBe(2);
    expect(runtime.rendererResize).toHaveBeenCalledWith(360, 640);

    stop();
    expect(stop).toHaveBeenCalledOnce();
    expect(runtime.on).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it.each([
    ['minimal', 1.1, 396, 704],
    ['reduced', 1.3, 468, 832],
    ['balanced', 1.7, 612, 1088],
    ['full', 2, 720, 1280],
  ])(
    'produces the expected %s backing dimensions',
    (_policy, resolution, expectedWidth, expectedHeight) => {
      runtime.playable.screen.resolution = resolution;
      const renderer = new WebGLRenderer();

      synchronizePixiScreen(renderer);
      runtime.resize();

      expect(renderer.canvas.width).toBe(expectedWidth);
      expect(renderer.canvas.height).toBe(expectedHeight);
    },
  );
});
