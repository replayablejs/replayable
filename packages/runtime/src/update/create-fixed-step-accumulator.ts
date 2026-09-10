import type { FixedStepAccumulator, FixedUpdateContext } from '#types/update.js';
import { FIXED_DELTA_SECONDS, MAX_FIXED_UPDATES_PER_FRAME } from '#update/constants.js';

// Every callback receives the same immutable-by-contract value. Reusing it
// avoids allocating an identical context for every simulation step.
const FIXED_UPDATE_CONTEXT: FixedUpdateContext = {
  deltaSeconds: FIXED_DELTA_SECONDS,
};

/**
 * Creates a bounded fixed-timestep accumulator.
 *
 * Rendered frames and simulation steps are intentionally independent. A fast
 * frame may produce no fixed step, while a slow frame may produce several. If
 * more than five steps are due, the accumulator drops the excess complete
 * steps after preserving the fractional progress needed for interpolation.
 *
 * With a 1/60-second fixed step:
 *
 * - a 1/120-second frame adds half a step and invokes no update;
 * - the next 1/120-second frame completes and invokes one update;
 * - a 1/30-second frame normally invokes two updates;
 * - a 200 ms stall owes roughly twelve updates, but invokes at most five and
 *   drops the remaining complete debt to prevent a spiral of death.
 */
export function createFixedStepAccumulator(): FixedStepAccumulator {
  // Only time not yet represented by a delivered simulation step is retained.
  let accumulatedSeconds = 0;

  return {
    advance(deltaSeconds, update): number {
      // Browser frames contribute real elapsed time even when they are faster
      // or slower than the fixed simulation frequency.
      accumulatedSeconds += deltaSeconds;

      // Whole fixed intervals are ready for simulation. Any fractional interval
      // remains in accumulatedSeconds and later becomes render interpolation.
      const pendingUpdates = Math.floor(accumulatedSeconds / FIXED_DELTA_SECONDS);
      const panicked = pendingUpdates > MAX_FIXED_UPDATES_PER_FRAME;
      const updatesToRun = Math.min(pendingUpdates, MAX_FIXED_UPDATES_PER_FRAME);

      // Reserve every permitted step before invoking consumer code. A callback
      // may remove the final listener, causing its owner to clear this
      // accumulator while the loop is still executing. Subtracting up front
      // prevents that clear from being followed by further negative deductions.
      accumulatedSeconds -= updatesToRun * FIXED_DELTA_SECONDS;

      // One slow browser frame may therefore produce several equal simulation
      // updates. All receive 1/60 second rather than a share of the frame delta.
      for (let updateIndex = 0; updateIndex < updatesToRun; updateIndex += 1) {
        update(FIXED_UPDATE_CONTEXT);
      }

      // After a panic, accumulatedSeconds still contains the complete steps we
      // deliberately refused to run plus a possible fractional step. Modulo
      // drops only that complete debt and preserves the fraction for smooth
      // rendering. For example, 7.25 remaining steps become 0.25.
      if (panicked) {
        accumulatedSeconds %= FIXED_DELTA_SECONDS;
      }

      // Dividing the remaining seconds by one fixed interval normalizes the
      // value for rendering: 0 is a boundary and 0.5 is halfway to the next.
      return accumulatedSeconds / FIXED_DELTA_SECONDS;
    },

    clearPendingTime(): void {
      // Completed updates already changed consumer state and cannot be undone;
      // only the not-yet-simulated fractional time is stored here.
      accumulatedSeconds = 0;
    },
  };
}
