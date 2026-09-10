import type { RuntimeUpdates, PostRenderContext } from '#types/update.js';
import { createFixedUpdate } from '#update/create-fixed-update.js';
import { createFrameScheduler } from '#update/create-frame-scheduler.js';
import { createFrameUpdate } from '#update/create-frame-update.js';
import { createUpdateChannel } from '#update/create-update-channel.js';

/**
 * Coordinates simulation and post-render delivery around one frame scheduler.
 *
 * Every Motion frame first advances internal lifecycle clocks, then fixed
 * simulation. Fixed interpolation accompanies the single variable update
 * rendered for that browser frame. Frame delivery is demand-driven: it begins
 * only after the runtime is ready, visible, and a timer or update listener
 * requires elapsed time. Post-render listeners also keep frames active and receive
 * the shared timestamp after Motion finishes its render phase.
 *
 * For example, registering a listener before `markReady()` does not start the
 * scheduler. If the host is already visible, `markReady()` starts it. Removing
 * the last listener or calling `setVisible(false)` stops it and discards any
 * partial fixed step so paused time cannot leak into a later frame.
 */
export function createRuntimeUpdates(): RuntimeUpdates {
  const activeTime = createUpdateChannel<number>(updateScheduler);
  const fixedUpdate = createFixedUpdate(updateScheduler);
  const frameUpdate = createFrameUpdate(updateScheduler);
  const postRender = createUpdateChannel<PostRenderContext>(updateScheduler);
  const scheduler = createFrameScheduler(handleFrame, handlePostRender);

  let ready = false;
  let visible = false;

  return {
    activeTime,
    fixedUpdate: fixedUpdate.channel,
    update: frameUpdate.channel,
    postRender,

    markReady(): void {
      ready = true;
      updateScheduler();
    },

    setVisible(nextVisible): void {
      visible = nextVisible;
      updateScheduler();
    },
  };

  /**
   * Advances lifecycle clocks and simulation before the variable frame update.
   *
   * For example, a frame carrying roughly 1/30 second may produce two 1/60
   * fixed updates followed by one variable update. The variable update receives
   * the accumulator's remaining fractional progress for render interpolation.
   */
  function handleFrame(deltaSeconds: number): void {
    activeTime.dispatch(deltaSeconds);

    const fixedInterpolation = fixedUpdate.advance(deltaSeconds);

    frameUpdate.advance(deltaSeconds, fixedInterpolation);
  }

  /** Renderers remain independent; only the shared Motion phase determines ordering. */
  function handlePostRender(timestamp: number): void {
    if (postRender.hasListeners()) {
      postRender.dispatch({ timestamp });
    }
  }

  /**
   * Makes scheduler activity match the runtime lifecycle and listener demand.
   *
   * Examples:
   *
   * - ready + visible + an update listener: start or remain running;
   * - not ready, hidden, or no listeners: stop and clear partial fixed time.
   *
   * `FrameScheduler` owns start/stop idempotence, so this function can state the
   * policy directly without tracking another copy of its running state.
   */
  function updateScheduler(): void {
    const hasListeners =
      activeTime.hasListeners() ||
      frameUpdate.hasListeners() ||
      fixedUpdate.hasListeners() ||
      postRender.hasListeners();

    if (ready && visible && hasListeners) {
      scheduler.start();
      return;
    }

    scheduler.stop();
    fixedUpdate.clearPendingTime();
  }
}
