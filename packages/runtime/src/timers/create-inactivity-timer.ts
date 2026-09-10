import type { InactivityTimerOptions, ManagedInactivityTimer } from '#types/timers.js';
import type { UpdateChannel } from '#types/update.js';

/**
 * Creates one application-owned inactivity timer on Replayable's visible-time
 * clock. The timer begins stopped, consumes frame time only while running, and
 * returns to its full duration after every trusted activity.
 */
export function createInactivityTimer(
  options: InactivityTimerOptions,
  activeTime: UpdateChannel<number>,
  activeTimers: Set<ManagedInactivityTimer>,
): ManagedInactivityTimer {
  const { duration, onTimeout } = options;

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error('Inactivity timer duration must be a positive finite number of seconds.');
  }

  let remainingSeconds = duration;
  let unsubscribeFromActiveTime: (() => void) | undefined;

  const timer: ManagedInactivityTimer = {
    resetForActivity,
    restart,
    start,
    stop,
  };

  return timer;

  /** Starts once without resetting a timer that is already running. */
  function start(): void {
    if (unsubscribeFromActiveTime !== undefined) {
      return;
    }

    remainingSeconds = duration;
    activeTimers.add(timer);
    unsubscribeFromActiveTime = activeTime.add(advance);
  }

  /** Resets the full duration and starts the timer when necessary. */
  function restart(): void {
    if (unsubscribeFromActiveTime === undefined) {
      start();
      return;
    }

    remainingSeconds = duration;
  }

  /** Restores the full duration only while this timer is running. */
  function resetForActivity(): void {
    if (unsubscribeFromActiveTime !== undefined) {
      remainingSeconds = duration;
    }
  }

  /** Stops the timer and releases its visible-time subscription. */
  function stop(): void {
    if (unsubscribeFromActiveTime === undefined) {
      return;
    }

    unsubscribeFromActiveTime();
    unsubscribeFromActiveTime = undefined;
    activeTimers.delete(timer);
    remainingSeconds = duration;
  }

  /** Stops before application code runs so `onTimeout` may safely restart it. */
  function advance(deltaSeconds: number): void {
    // A previous callback may stop this timer while the channel still holds
    // its current dispatch snapshot. That final delivery must do no work.
    if (unsubscribeFromActiveTime === undefined) {
      return;
    }

    remainingSeconds -= deltaSeconds;

    if (remainingSeconds > 0) {
      return;
    }

    stop();
    onTimeout();
  }
}
