import { z } from 'zod';

import { assetRuleSchema } from './base.js';

/** Image options that allow lossy format selection and encoder quality. */
export const lossyImageOptionsSchema = z.strictObject({
  /** Width multiplier applied before encoding. */
  scale: z.number().positive().default(1),
  /** Selects the default lossy encoding policy. */
  lossless: z.literal(false).default(false),
  /** Shared lossy encoder quality; incompatible with lossless output. */
  quality: z.number().int().min(1).max(100).optional(),
});

/** Image options that preserve exact pixel values and reject lossy quality. */
export const losslessImageOptionsSchema = z.strictObject({
  /** Width multiplier applied before encoding. */
  scale: z.number().positive().default(1),
  /** Restricts selection to encodings that preserve exact pixel values. */
  lossless: z.literal(true),
});

/** Options shared by standalone images and Spine texture pages. */
export const imageOptionsSchema = z.union([lossyImageOptionsSchema, losslessImageOptionsSchema]);

/** Rule for standalone sprites and 3D textures. */
export const imageRuleSchema = assetRuleSchema.extend({
  options: imageOptionsSchema.prefault({}),
});
