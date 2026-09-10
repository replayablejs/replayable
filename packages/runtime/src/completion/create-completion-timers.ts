import type {
  CompletionClock,
  CompletionTimerLifecycle,
  RuntimeCompletionConfig,
} from '#types/completion.js';
import type { CompletionTarget, CompletionTimers } from '#types/timers.js';
import type { UpdateChannel } from '#types/update.js';

/**
 * Creates the framework-owned duration and inactivity timers for one playable.
 *
 * These are logical clocks, not `setTimeout` calls. They consume visible active
 * time from Replayable's frame scheduler, so neither clock advances while the
 * host reports that the ad is hidden.
 *
 * The clocks have deliberately different policies:
 *
 * - Duration starts when the runtime becomes ready or after the first trusted
 *   interaction, depending on the active network profile.
 * - Inactivity always waits for the first trusted interaction and returns to
 *   its full configured duration after every later interaction.
 *
 * An interaction may occur while primary assets are still loading. Therefore
 * `start(alreadyInteracted)` receives the current interaction state when runtime
 * readiness is finally reached. If it is `true`, both configured clocks begin
 * immediately rather than waiting for another interaction.
 *
 * When both clocks expire during the same frame, duration wins. This gives one
 * deterministic completion reason without allowing two terminal transitions.
 */
export function createCompletionTimers(
  config: RuntimeCompletionConfig,
  activeTime: UpdateChannel<number>,
  target: CompletionTarget,
): CompletionTimers {
  const durationClock: CompletionClock = {
    remainingSeconds: config.duration,
    running: false,
  };
  const inactivityClock: CompletionClock = {
    remainingSeconds: config.inactivity,
    running: false,
  };

  let unsubscribeFromActiveTime: (() => void) | undefined;
  let lifecycle: CompletionTimerLifecycle = 'idle';

  return {
    recordActivity,
    recordFirstInteraction,
    start,
    stop,
  };

  /** Starts configured clocks when runtime readiness has been reached. */
  function start(alreadyInteracted: boolean): void {
    if (lifecycle !== 'idle') {
      return;
    }

    lifecycle = 'active';

    if (alreadyInteracted) {
      startDurationClock();
      restartInactivityClock();
    } else if (config.durationStart === 'ready') {
      startDurationClock();
    }

    subscribeToActiveTime();
  }

  /** Starts the network-gated duration clock after the first interaction. */
  function recordFirstInteraction(): void {
    if (lifecycle !== 'active') {
      return;
    }

    if (config.durationStart === 'interaction') {
      startDurationClock();
      subscribeToActiveTime();
    }
  }

  /** Starts or resets inactivity after every trusted user activity. */
  function recordActivity(): void {
    if (lifecycle !== 'active') {
      return;
    }

    restartInactivityClock();
    subscribeToActiveTime();
  }

  /** Permanently releases frame work after the playable has completed. */
  function stop(): void {
    if (lifecycle === 'stopped') {
      return;
    }

    lifecycle = 'stopped';
    durationClock.running = false;
    inactivityClock.running = false;
    unsubscribeFromActiveTime?.();
    unsubscribeFromActiveTime = undefined;
  }

  /** Starts configured duration without resetting time consumed earlier. */
  function startDurationClock(): void {
    if (durationClock.remainingSeconds !== undefined) {
      durationClock.running = true;
    }
  }

  /** Starts or resets inactivity only when that clock was configured. */
  function restartInactivityClock(): void {
    if (config.inactivity === undefined) {
      return;
    }

    inactivityClock.remainingSeconds = config.inactivity;
    inactivityClock.running = true;
  }

  /** Requests visible frame time only while at least one clock needs it. */
  function subscribeToActiveTime(): void {
    if (!hasRunningClock()) {
      return;
    }

    if (unsubscribeFromActiveTime !== undefined) {
      return;
    }

    unsubscribeFromActiveTime = activeTime.add(advanceClocks);
  }

  /** Advances duration first so it wins when both clocks expire together. */
  function advanceClocks(deltaSeconds: number): void {
    advanceClock(durationClock, deltaSeconds);

    if (hasClockExpired(durationClock)) {
      stop();
      target.applyCompletion('duration-timeout');
      return;
    }

    advanceClock(inactivityClock, deltaSeconds);

    if (hasClockExpired(inactivityClock)) {
      stop();
      target.applyCompletion('inactivity-timeout');
    }
  }

  /** Reports whether the shared active-time subscription is currently useful. */
  function hasRunningClock(): boolean {
    return durationClock.running || inactivityClock.running;
  }
}

/** Subtracts visible elapsed time from one running logical clock. */
function advanceClock(clock: CompletionClock, deltaSeconds: number): void {
  if (!clock.running || clock.remainingSeconds === undefined) {
    return;
  }

  clock.remainingSeconds -= deltaSeconds;
}

/** Reports whether one running logical clock has reached its deadline. */
function hasClockExpired(clock: CompletionClock): boolean {
  return clock.running && clock.remainingSeconds !== undefined && clock.remainingSeconds <= 0;
}
