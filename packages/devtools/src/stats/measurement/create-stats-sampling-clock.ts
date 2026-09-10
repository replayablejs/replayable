import type { StatsSamplingClock } from '#types/sampling-clock.js';

const REFRESH_INTERVAL_MILLISECONDS = 500;

/** Delivers frames with real elapsed time (initially zero) and permits collection twice per second. */
export function createStatsSamplingClock(): StatsSamplingClock {
  let previousTimestamp: number | undefined;
  let nextRefreshTimestamp = 0;
  let hasFrameIntervals = false;

  return { reset, advance };

  /** The first subsequent frame establishes a baseline, excluding all hidden time. */
  function reset(timestamp: number): void {
    previousTimestamp = undefined;
    nextRefreshTimestamp = timestamp + REFRESH_INTERVAL_MILLISECONDS;
    hasFrameIntervals = false;
  }

  /** Delivers the frame before collection so the deadline-crossing frame belongs to this window. */
  function advance(timestamp: number, onFrame: (deltaMilliseconds: number) => void): boolean {
    advanceFrame(timestamp, onFrame);

    if (timestamp < nextRefreshTimestamp) {
      return false;
    }

    // A stall produces one refresh, not repeated catch-up samples of the same data.
    // Even an empty window advances the deadline while waiting for real intervals.
    nextRefreshTimestamp = timestamp + REFRESH_INTERVAL_MILLISECONDS;

    if (!hasFrameIntervals) {
      return false;
    }

    // Keep the frame baseline: the next interval starts at this frame, not after it.
    hasFrameIntervals = false;
    return true;
  }

  /** Delivers the initial frame with zero elapsed time; repeated timestamps are ignored. */
  function advanceFrame(timestamp: number, onFrame: (deltaMilliseconds: number) => void): void {
    const previous = previousTimestamp;
    previousTimestamp = timestamp;

    if (previous === undefined) {
      // Render counters still belong to this first frame. Interval metrics ignore
      // zero, and this baseline alone does not make a refresh window eligible.
      onFrame(0);
      return;
    }

    const deltaMilliseconds = timestamp - previous;

    if (deltaMilliseconds <= 0) {
      return;
    }

    hasFrameIntervals = true;
    onFrame(deltaMilliseconds);
  }
}
