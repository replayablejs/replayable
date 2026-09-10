/**
 * Duration of every fixed simulation step, measured in seconds.
 *
 * A 60 Hz step matches the conventional update frequency expected by the
 * physics engines that Replayable integrations will drive.
 */
export const FIXED_DELTA_SECONDS = 1 / 60;

/**
 * Maximum number of fixed steps that may run during one rendered frame.
 *
 * Limiting catch-up prevents one slow browser frame from creating an unbounded
 * backlog of simulation work—the usual fixed-timestep "spiral of death."
 */
export const MAX_FIXED_UPDATES_PER_FRAME = 5;

/**
 * Maximum active gameplay time exposed by one variable update.
 *
 * Keeping this equal to the fixed catch-up budget means rendering and fixed
 * simulation can advance by at most the same 5/60 seconds after a frame stall.
 */
export const MAX_UPDATE_DELTA_SECONDS = FIXED_DELTA_SECONDS * MAX_FIXED_UPDATES_PER_FRAME;
