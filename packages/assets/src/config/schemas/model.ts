import { z } from 'zod';

import { assetRuleSchema } from './base.js';
import { imageOptionsSchema } from './image.js';

/** Model conversion always produces a self-contained GLB. */
export const modelOptionsSchema = z.strictObject({
  /** Opt in to a decoder only when the target integration provides it. */
  compression: z.enum(['none', 'draco', 'meshopt']).default('none'),
  /** Color images use this policy; data maps always use lossless encoding. */
  textures: imageOptionsSchema.prefault({ lossless: true }),
});

export const modelRuleSchema = assetRuleSchema.extend({
  options: modelOptionsSchema.prefault({}),
});
