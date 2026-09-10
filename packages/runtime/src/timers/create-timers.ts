import { createCompletionTimers } from '#completion/create-completion-timers.js';
import { createInactivityTimer } from '#timers/create-inactivity-timer.js';
import { delay } from '#timers/delay.js';
import type { RuntimeCompletionConfig } from '#types/completion.js';
import type {
  TimerController,
  CompletionTarget,
  CompletionTimers,
  InactivityTimer,
  InactivityTimerOptions,
  ManagedInactivityTimer,
  PlayableTimers,
} from '#types/timers.js';
import type { UpdateChannel } from '#types/update.js';

/**
 * Creates Replayable's timer subsystem around one shared visible-time clock.
 *
 * The returned public timers begin stopped and subscribe independently while
 * running, so creating a timer has no frame cost. The internal completion
 * factory delegates terminal policy to its dedicated implementation without
 * exposing that policy through `playable.timers`. Trusted activity resets only
 * active inactivity timers; stopped timers retain no elapsed inactivity.
 *
 * @example Display a hint after three inactive seconds.
 *
 * ```ts
 * const hintTimer = playable.timers.createInactivityTimer({
 *   duration: 3,
 *   onTimeout: showHint,
 * });
 *
 * hintTimer.start();
 * ```
 */
export function createTimers(activeTime: UpdateChannel<number>): TimerController {
  const activeTimers = new Set<ManagedInactivityTimer>();
  const timers: PlayableTimers = {
    delay(duration): Promise<void> {
      return delay(duration, activeTime);
    },

    createInactivityTimer(options: InactivityTimerOptions): InactivityTimer {
      return createInactivityTimer(options, activeTime, activeTimers);
    },
  };

  return {
    timers,
    createCompletion,
    recordActivity,
  };

  /** Creates framework-owned completion clocks on the shared visible-time channel. */
  function createCompletion(
    config: RuntimeCompletionConfig,
    target: CompletionTarget,
  ): CompletionTimers {
    return createCompletionTimers(config, activeTime, target);
  }

  /** Restores every running public inactivity timer after trusted activity. */
  function recordActivity(): void {
    for (const timer of activeTimers) {
      timer.resetForActivity();
    }
  }
}
