import { cancelFrame, frame, type FrameData } from 'motion';

import type { FrameUpdateCallback, FrameScheduler } from '#types/update.js';

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Creates the sole requestAnimationFrame scheduler used by Replayable.
 *
 * Motion's own delta is intentionally ignored because Motion clamps it. The
 * difference between consecutive timestamps retains the real elapsed time
 * required by fixed-step catch-up and panic handling.
 */
export function createFrameScheduler(
  update: FrameUpdateCallback,
  postRender: (timestamp: number) => void,
): FrameScheduler {
  let previousTimestamp = 0;
  let running = false;
  let postRenderPending = false;

  return {
    start(): void {
      if (running) {
        return;
      }

      running = true;
      frame.update(initializeFrameLoop);
    },

    stop(): void {
      if (!running) {
        return;
      }

      running = false;
      postRenderPending = false;
      cancelFrame(initializeFrameLoop);
      cancelFrame(updateFrame);
      cancelFrame(deliverPostRender);
    },
  };

  /**
   * Establishes a fresh timestamp baseline before persistent delivery begins.
   *
   * This separate first frame ensures time spent stopped—while hidden, not yet
   * ready, or without listeners—never becomes the next frame's delta. The zero
   * update gives variable listeners an initial render opportunity without
   * advancing animation or fixed simulation time.
   */
  function initializeFrameLoop({ timestamp }: FrameData): void {
    if (!running) {
      return;
    }
    previousTimestamp = timestamp;
    frame.update(updateFrame, true);
    update(0);
    if (running) {
      postRenderPending = true;
      frame.postRender(deliverPostRender);
    }
  }

  /** Converts Motion's millisecond timestamp into one elapsed duration in seconds. */
  function updateFrame({ timestamp }: FrameData): void {
    if (!running) {
      return;
    }
    const deltaSeconds = (timestamp - previousTimestamp) / MILLISECONDS_PER_SECOND;

    previousTimestamp = timestamp;
    update(deltaSeconds);
    if (running) {
      postRenderPending = true;
      frame.postRender(deliverPostRender);
    }
  }

  /** Stops also invalidate callbacks already in Motion's processing snapshot. */
  function deliverPostRender({ timestamp }: FrameData): void {
    if (running && postRenderPending) {
      postRenderPending = false;
      postRender(timestamp);
    }
  }
}
