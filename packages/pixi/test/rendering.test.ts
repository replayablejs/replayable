import { Container, Ticker, WebGLRenderer } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';

import { startPixiRendering } from '../src/renderer/start-pixi-rendering.js';

const runtime = vi.hoisted(() => {
  let update: ((context: { deltaSeconds: number }) => void) | undefined;
  const stop = vi.fn<() => void>();
  const add = vi.fn<(listener: (context: { deltaSeconds: number }) => void) => () => void>(
    (listener) => {
      update = listener;
      return stop;
    },
  );

  return {
    playable: {
      update: {
        add,
      },
    },
    add,
    stop,
    update: (deltaSeconds: number) => update?.({ deltaSeconds }),
  };
});

const pixi = vi.hoisted(() => ({
  calls: [] as string[],
  render: vi.fn<() => void>(() => pixi.calls.push('render')),
  resetState: vi.fn<() => void>(() => pixi.calls.push('reset')),
  ticker: {
    autoStart: true,
    lastTime: -1,
    stop: vi.fn<() => void>(),
    update: vi.fn<(time: number) => void>(() => pixi.calls.push('ticker')),
  },
}));

vi.mock('@replayablejs/runtime', () => ({ playable: runtime.playable }));
vi.mock('pixi.js', () => ({
  Container: class {
    readonly mocked = true;
  },
  Ticker: { shared: pixi.ticker },
  WebGLRenderer: class {
    render = pixi.render;
    resetState = pixi.resetState;
  },
}));

describe('Pixi rendering', () => {
  it('uses Replayable frames to advance Pixi systems before rendering', () => {
    const renderer = new WebGLRenderer();
    const stop = startPixiRendering(renderer, new Container());

    expect(Ticker.shared.autoStart).toBe(false);
    expect(pixi.ticker.stop).toHaveBeenCalledOnce();

    runtime.update(0.025);

    expect(pixi.ticker.update).toHaveBeenCalledWith(25);
    expect(pixi.calls).toEqual(['reset', 'ticker', 'render']);
    expect(stop).toBe(runtime.stop);
    expect(runtime.add).toHaveBeenCalledOnce();
  });
});
