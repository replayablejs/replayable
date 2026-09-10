import { z } from 'zod';

/** Whether generated playable variants include runtime audio capability. */
export const audioSchema = z.boolean().default(true);

/** Allows a variant dimension to disable—but never re-enable—project audio. */
export const audioOverrideSchema = z.literal(false);
