import { z } from 'zod';

/** Positive duration in seconds used by a playable completion timer. */
const completionDurationSchema = z.number().positive();

/** Automatic conditions that may complete a playable. */
export const completionSchema = z
  .strictObject({
    /** Maximum playable duration in seconds. */
    duration: completionDurationSchema.optional(),
    /** Allowed inactivity in seconds after the first interaction. */
    inactivity: completionDurationSchema.optional(),
  })
  .default({});

/** Per-variant completion values, where `false` disables an inherited timer. */
export const completionOverrideSchema = z.strictObject({
  duration: completionDurationSchema.or(z.literal(false)).optional(),
  inactivity: completionDurationSchema.or(z.literal(false)).optional(),
});
