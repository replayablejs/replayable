import type { FixedUpdate, FixedUpdateContext } from '#types/update.js';
import { createFixedStepAccumulator } from '#update/create-fixed-step-accumulator.js';
import { createUpdateChannel } from '#update/create-update-channel.js';

/**
 * Creates the fixed channel together with its bounded timestep accumulator.
 *
 * At 120 rendered frames per second, two ideal calls demonstrate the boundary:
 *
 * 1. `advance(1 / 120)` dispatches nothing and returns `0.5`;
 * 2. `advance(1 / 120)` dispatches one `1 / 60` update and returns `0`.
 *
 * `onActivityChange` runs when the channel gains its first listener or loses its
 * last listener, allowing the runtime to synchronize frame scheduling.
 */
export function createFixedUpdate(onActivityChange: () => void): FixedUpdate {
  const accumulator = createFixedStepAccumulator();
  const channel = createUpdateChannel<FixedUpdateContext>(onActivityChange);

  return {
    channel,

    advance(deltaSeconds): number {
      // Time that passes without a fixed listener must not be remembered. A
      // later subscriber starts from the current frame instead of receiving
      // simulation work accumulated before it existed.
      if (!channel.hasListeners()) {
        accumulator.clearPendingTime();
        return 0;
      }

      // The accumulator may invoke dispatch zero, one, or several times. Its
      // return value is the incomplete fraction left after all due fixed steps.
      const interpolation = accumulator.advance(deltaSeconds, dispatch);

      // The final listener may remove itself from inside a fixed update. Clear
      // the remaining fraction so resubscribing later cannot continue timing
      // that belonged to a channel with no consumers.
      if (!channel.hasListeners()) {
        accumulator.clearPendingTime();
        return 0;
      }

      return interpolation;
    },

    clearPendingTime(): void {
      // Visibility pauses call this explicitly even while listeners remain.
      accumulator.clearPendingTime();
    },

    hasListeners(): boolean {
      return channel.hasListeners();
    },
  };

  /** Keeps the accumulator independent from the channel controller it drives. */
  function dispatch(context: FixedUpdateContext): void {
    channel.dispatch(context);
  }
}
