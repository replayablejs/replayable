import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import type { animate as Animate } from '../src/animate.js';

const runtime = vi.hoisted(() => {
  const listeners = new Set<(visible: boolean) => void>();
  function onVisibilityChange(_event: string, listener: (visible: boolean) => void): () => void {
    listeners.add(listener);
    return (): void => {
      listeners.delete(listener);
    };
  }

  return {
    state: { visible: true },
    on: vi.fn<typeof onVisibilityChange>(onVisibilityChange),
    setVisible(visible: boolean): void {
      this.state.visible = visible;
      for (const listener of listeners) {
        listener(visible);
      }
    },
  };
});

vi.mock('@replayablejs/runtime', () => ({ playable: runtime }));

let animate: typeof Animate;
let nextFrameId = 0;
const frameTimers = new Map<number, ReturnType<typeof setTimeout>>();

beforeAll(async () => {
  class TestElement {
    readonly nodeType = 1;
  }

  vi.stubGlobal('Element', TestElement);
  vi.stubGlobal('HTMLElement', TestElement);
  vi.stubGlobal('SVGElement', TestElement);
  vi.stubGlobal('NodeList', class NodeList extends Array<unknown> {});
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    const frameId = ++nextFrameId;
    const timer = setTimeout(() => {
      frameTimers.delete(frameId);
      callback(performance.now());
    }, 1);

    frameTimers.set(frameId, timer);

    return frameId;
  });
  vi.stubGlobal('cancelAnimationFrame', (frameId: number): void => {
    const timer = frameTimers.get(frameId);

    if (timer !== undefined) {
      clearTimeout(timer);
      frameTimers.delete(frameId);
    }
  });

  ({ animate } = await import('../src/animate.js'));
});

afterAll(() => {
  for (const timer of frameTimers.values()) {
    clearTimeout(timer);
  }

  frameTimers.clear();
  vi.unstubAllGlobals();
});

describe('animate', () => {
  it('pauses unfinished properties without replaying finished properties on visibility resume', async () => {
    let x = 0;
    const recordX = vi.fn<(value: number) => void>();
    const target = {
      get x(): number {
        return x;
      },
      set x(value: number) {
        x = value;
        recordX(value);
      },
      y: 0,
    };
    const controls = animate(
      target,
      { x: 10, y: 100 },
      {
        x: { duration: 0.01 },
        y: { duration: 0.3 },
        ease: 'linear',
      },
    );

    try {
      await vi.waitFor(() => {
        expect(target.x).toBe(10);
        expect(target.y).toBeGreaterThan(0);
        expect(target.y).toBeLessThan(100);
      });
      runtime.setVisible(false);
      // Motion commits its held position on the next scheduled tick. After
      // that native pause settles, additional hidden frames must not advance it.
      await new Promise((resolve) => setTimeout(resolve, 20));
      const pausedY = target.y;
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(target.y).toBe(pausedY);

      recordX.mockClear();
      runtime.setVisible(true);
      await controls;
      expect(target.y).toBe(100);
      // Motion's object renderer may reassign x while rendering y, but must
      // never rewind the completed property into another animation cycle.
      expect(recordX.mock.calls.every(([value]) => value === 10)).toBe(true);
    } finally {
      controls.stop();
      runtime.setVisible(true);
    }
  });

  it('delegates plain-object interpolation to Motion', async () => {
    const target = { x: 0 };

    await animate(target, { x: 10 }, { duration: 0.02, ease: 'linear' });

    expect(target.x).toBeCloseTo(10);
  });

  it('retains Motion spring behavior', async () => {
    const target = { scale: 0 };

    await animate(target, { scale: 1 }, { bounce: 0, duration: 0.03, type: 'spring' });

    expect(target.scale).toBeCloseTo(1);
  });

  it('retains Motion sequence behavior', async () => {
    const target = { x: 0 };

    await animate([
      [target, { x: 5 }, { duration: 0.01 }],
      [target, { x: 10 }, { duration: 0.01 }],
    ]);

    expect(target.x).toBeCloseTo(10);
  });
});
