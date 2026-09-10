import { z } from 'zod';

import { assetRuleSchema, requiredStringSchema } from './base.js';

/** Required runtime family name plus optional characters added to the subset. */
export const fontOptionsSchema = z.strictObject({
  /** Runtime CSS font-family name. */
  family: requiredStringSchema,
  /** Literal characters added to printable ASCII and resolved locale text. */
  extraCharacters: z.string().min(1).optional(),
});

/**
 * Configuration for one matched font source.
 *
 * Every matched source is subset and converted to WOFF2. Output format is not
 * configurable because playable builds ship one compact web-font file.
 */
export const fontRuleSchema = assetRuleSchema.extend({
  options: fontOptionsSchema,
});
