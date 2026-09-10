import { z } from 'zod';

/**
 * Authored control visibility for local development and exported preview.
 * Ad-network profiles replace these preferences with their delivery policy.
 */
export const controlsSchema = z
  .strictObject({
    /** Shows the persistent CTA in preview; ad networks own their final policy. */
    persistentCta: z.boolean().default(true),
  })
  .prefault({});
