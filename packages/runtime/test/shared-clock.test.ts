import { afterEach, describe, expect, it, vi } from 'vitest';

const frameCallbacks: FrameRequestCallback[] = [];

afterEach(() => {
  frameCallbacks.length = 0;
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('shared Motion clock', () => {
  it('delivers runtime updates and Motion work through one browser frame', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
      frameCallbacks.push(callback);

      return frameCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', (): void => {});

    const [{ cancelFrame, frame }, { createFrameScheduler }] = await Promise.all([
      import('motion'),
      import('../src/update/create-frame-scheduler.js'),
    ]);
    const runtimeDeltas: number[] = [];
    const motionTimestamps: number[] = [];
    const renderedTimestamps: number[] = [];
    const scheduler = createFrameScheduler(
      (deltaSeconds) => {
        runtimeDeltas.push(deltaSeconds);
      },
      (timestamp) => {
        renderedTimestamps.push(timestamp);
      },
    );
    const observeMotionFrame = ({ timestamp }: { timestamp: number }): void => {
      motionTimestamps.push(timestamp);
    };

    scheduler.start();
    frame.update(observeMotionFrame, true);

    // Both consumers joined Motion's one scheduled requestAnimationFrame.
    expect(frameCallbacks).toHaveLength(1);

    deliverFrame(1000);
    deliverFrame(1016);

    const [initialTimestamp, nextTimestamp] = motionTimestamps;

    if (initialTimestamp === undefined || nextTimestamp === undefined) {
      throw new Error(`Expected two Motion timestamps, received ${motionTimestamps.length}.`);
    }

    expect(runtimeDeltas[0]).toBe(0);
    expect(renderedTimestamps).toEqual(motionTimestamps);
    expect(runtimeDeltas[1]).toBeCloseTo((nextTimestamp - initialTimestamp) / 1000);

    scheduler.stop();
    cancelFrame(observeMotionFrame);
  });
});

/** Delivers one deterministic browser timestamp to Motion's shared batcher. */
function deliverFrame(timestamp: number): void {
  const callback = frameCallbacks.shift();

  if (callback === undefined) {
    throw new Error(`No browser frame was scheduled for timestamp ${timestamp}.`);
  }

  callback(timestamp);
}
