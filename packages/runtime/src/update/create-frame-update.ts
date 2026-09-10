import type { FrameUpdate, UpdateContext } from '#types/update.js';
import { MAX_UPDATE_DELTA_SECONDS } from '#update/constants.js';
import { createUpdateChannel } from '#update/create-update-channel.js';

/**
 * Creates the variable update output independently from frame scheduling.
 *
 * A normal 60 FPS frame exposes roughly `0.0167` seconds. After a 200 ms stall,
 * the exposed delta is capped at five fixed steps—roughly `0.0833` seconds—so
 * visual animation cannot make one extreme jump. Fixed simulation receives the
 * real elapsed duration separately and performs its own bounded catch-up.
 *
 * `fixedInterpolation` is forwarded unchanged because the fixed accumulator,
 * not this channel, owns the remaining simulation fraction.
 * `onActivityChange` notifies the runtime when the first listener appears or the
 * last listener disappears so scheduling remains demand-driven.
 */
export function createFrameUpdate(onActivityChange: () => void): FrameUpdate {
  const channel = createUpdateChannel<UpdateContext>(onActivityChange);

  return {
    channel,

    advance(deltaSeconds, fixedInterpolation): void {
      // Avoid constructing an UpdateContext on frames with no consumers. This
      // path is also used when only fixed simulation has listeners.
      if (!channel.hasListeners()) {
        return;
      }

      // `deltaSeconds` is the real time since the previous active browser
      // frame. It can become unusually large when an ad SDK or application
      // task blocks the main thread, garbage collection takes a long time, or
      // the browser delays an otherwise active frame. Passing that full
      // duration to animation code could move an object a large distance in a
      // single frame and make tweens appear to teleport. Hidden time is not a
      // source of large deltas here: visibility changes stop the scheduler,
      // and restarting it establishes a new timestamp baseline.
      //
      // Cap gameplay time to the same five-step budget used by fixed
      // simulation. For example, a 500 ms browser stall is reported to update
      // listeners as roughly 83 ms (`5 * 1/60`) rather than 500 ms. The excess
      // time is intentionally discarded: gameplay briefly slows down instead
      // of attempting an unsafe visual catch-up. Code that needs actual
      // wall-clock time, such as analytics or deadlines, should read
      // `performance.now()` rather than accumulate this clamped value.
      channel.dispatch({
        deltaSeconds: Math.min(deltaSeconds, MAX_UPDATE_DELTA_SECONDS),
        fixedInterpolation,
      });
    },

    hasListeners(): boolean {
      return channel.hasListeners();
    },
  };
}
