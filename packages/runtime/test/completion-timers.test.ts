import { describe, expect, it, vi } from 'vitest';

import { createCompletionTimers } from '../src/completion/create-completion-timers.js';
import type { PlayableCompletionReason } from '../src/types/completion.js';

describe('completion timers', () => {
  it('starts ready-gated duration immediately and gives duration deterministic priority', () => {
    const harness = createTimerHarness();
    const timers = createCompletionTimers(
      { duration: 3, durationStart: 'ready', inactivity: 3 },
      harness.activeTime,
      harness.target,
    );

    timers.start(true);
    harness.advance(3);

    expect(harness.complete).toHaveBeenCalledOnce();
    expect(harness.complete).toHaveBeenCalledWith('duration-timeout');
  });

  it('waits for interaction before starting interaction-gated duration and inactivity', () => {
    const harness = createTimerHarness();
    const timers = createCompletionTimers(
      { duration: 5, durationStart: 'interaction', inactivity: 2 },
      harness.activeTime,
      harness.target,
    );

    timers.start(false);
    expect(harness.hasListener()).toBe(false);

    timers.recordFirstInteraction();
    timers.recordActivity();
    harness.advance(1.5);
    timers.recordActivity();
    harness.advance(1.5);

    expect(harness.complete).not.toHaveBeenCalled();

    harness.advance(0.5);

    expect(harness.complete).toHaveBeenCalledWith('inactivity-timeout');
  });

  it('stops advancing and releases frame demand after terminal completion', () => {
    const harness = createTimerHarness();
    const timers = createCompletionTimers(
      { duration: 1, durationStart: 'ready' },
      harness.activeTime,
      {
        applyCompletion(reason): void {
          harness.complete(reason);
          timers.stop();
        },
      },
    );

    timers.start(false);
    harness.advance(1);

    expect(harness.hasListener()).toBe(false);
    expect(() => harness.advance(1)).toThrow('No active completion timer listener.');
  });
});

function createTimerHarness() {
  let listener: ((deltaSeconds: number) => void) | undefined;
  const complete = vi.fn<(reason: PlayableCompletionReason) => void>();

  return {
    activeTime: {
      add(nextListener: (deltaSeconds: number) => void): () => void {
        listener = nextListener;

        return (): void => {
          listener = undefined;
        };
      },
    },

    advance(deltaSeconds: number): void {
      if (listener === undefined) {
        throw new Error('No active completion timer listener.');
      }

      listener(deltaSeconds);
    },

    complete,

    hasListener(): boolean {
      return listener !== undefined;
    },

    target: {
      applyCompletion(reason: PlayableCompletionReason): void {
        complete(reason);
      },
    },
  };
}
