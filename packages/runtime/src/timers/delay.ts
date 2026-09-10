import type { UpdateChannel } from '#types/update.js';

/**
 * Resolves after the requested amount of Replayable active time has elapsed.
 *
 * Unlike a browser timeout, the delay advances only while the host reports the
 * playable as visible. Its temporary clock subscription is removed before the
 * promise resolves, so a completed delay leaves no frame-scheduling work.
 *
 * @example Keep a solved puzzle visible for seven tenths of an active second.
 *
 *     await playable.timers.delay(0.7);
 *     showEndCard();
 */
export function delay(duration: number, activeTime: UpdateChannel<number>): Promise<void> {
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error('Delay duration must be a non-negative finite number of seconds.');
  }

  if (duration === 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let remaining = duration;
    const removeActiveTimeListener = activeTime.add(advanceDelay);

    /** Accumulates visible frame time until this one-shot delay is complete. */
    function advanceDelay(deltaSeconds: number): void {
      remaining -= deltaSeconds;

      if (remaining > 0) {
        return;
      }

      removeActiveTimeListener();
      resolve();
    }
  });
}
