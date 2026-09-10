import { describe, expect, it, vi } from 'vitest';

import { createTimers } from '../src/timers/create-timers.js';
import { createUpdateChannel } from '../src/update/create-update-channel.js';

describe('playable timers', () => {
  it('ignores a stopped timer still present in the active dispatch snapshot', () => {
    const activeTime = createUpdateChannel<number>(() => {});
    const controller = createTimers(activeTime);
    const onTimeout = vi.fn<() => void>();
    const timer = controller.timers.createInactivityTimer({ duration: 1, onTimeout });
    const stopEarlier = activeTime.add(() => timer.stop());
    timer.start();

    activeTime.dispatch(1);
    expect(onTimeout).not.toHaveBeenCalled();

    stopEarlier();
    timer.start();
    activeTime.dispatch(0.5);
    expect(onTimeout).not.toHaveBeenCalled();
    activeTime.dispatch(0.5);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('resolves delays after the requested active time and removes their listener', async () => {
    const harness = createTimerHarness();
    const controller = createTimers(harness.activeTime);
    const resolved = vi.fn<() => void>();

    void controller.timers.delay(0.7).then(resolved);

    expect(harness.listenerCount()).toBe(1);

    harness.advance(0.4);
    await Promise.resolve();
    expect(resolved).not.toHaveBeenCalled();

    harness.advance(0.3);
    await Promise.resolve();
    expect(resolved).toHaveBeenCalledOnce();
    expect(harness.listenerCount()).toBe(0);
  });

  it('resolves zero-duration delays without subscribing to active time', async () => {
    const harness = createTimerHarness();
    const controller = createTimers(harness.activeTime);

    await expect(controller.timers.delay(0)).resolves.toBeUndefined();
    expect(harness.listenerCount()).toBe(0);
  });

  it('rejects invalid delay durations', () => {
    const controller = createTimers({ add: () => (): void => {} });

    for (const duration of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => controller.timers.delay(duration)).toThrow('non-negative finite number');
    }
  });

  it('starts explicitly, ignores duplicate starts, and resets after activity', () => {
    const harness = createTimerHarness();
    const controller = createTimers(harness.activeTime);
    const onTimeout = vi.fn<() => void>();
    const timer = controller.timers.createInactivityTimer({ duration: 3, onTimeout });

    expect(harness.listenerCount()).toBe(0);

    timer.start();
    timer.start();
    expect(harness.listenerCount()).toBe(1);

    harness.advance(2);
    controller.recordActivity();
    harness.advance(2);
    expect(onTimeout).not.toHaveBeenCalled();

    harness.advance(1);
    expect(onTimeout).toHaveBeenCalledOnce();
    expect(harness.listenerCount()).toBe(0);
  });

  it('supports stopping and restarting without retaining elapsed inactivity', () => {
    const harness = createTimerHarness();
    const controller = createTimers(harness.activeTime);
    const onTimeout = vi.fn<() => void>();
    const timer = controller.timers.createInactivityTimer({ duration: 2, onTimeout });

    timer.start();
    harness.advance(1.5);
    timer.stop();
    timer.start();
    harness.advance(1.5);
    expect(onTimeout).not.toHaveBeenCalled();

    timer.restart();
    harness.advance(2);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('rejects non-positive and non-finite durations', () => {
    const controller = createTimers({ add: () => (): void => {} });

    for (const duration of [-1, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        controller.timers.createInactivityTimer({ duration, onTimeout: (): void => {} }),
      ).toThrow('positive finite number');
    }
  });
});

function createTimerHarness() {
  const listeners = new Set<(deltaSeconds: number) => void>();

  return {
    activeTime: {
      add(listener: (deltaSeconds: number) => void): () => void {
        listeners.add(listener);

        return (): void => {
          listeners.delete(listener);
        };
      },
    },

    advance(deltaSeconds: number): void {
      for (const listener of [...listeners]) {
        listener(deltaSeconds);
      }
    },

    listenerCount(): number {
      return listeners.size;
    },
  };
}
