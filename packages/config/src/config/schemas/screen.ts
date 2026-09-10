import { z } from 'zod';

import { positiveNumberSchema } from './base.js';

/** Inclusive numeric bounds whose lower value cannot exceed the upper value. */
const rangeSchema = z
  .strictObject({
    min: positiveNumberSchema,
    max: positiveNumberSchema,
  })
  .refine(({ max, min }) => min <= max, 'The minimum cannot exceed the maximum.');

/** One orientation's authored coordinate system and availability. */
const orientationSchema = z.strictObject({
  enabled: z.boolean(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  ratio: rangeSchema,
});

/** Ordered renderer-quality multipliers from the lowest to the highest policy. */
const renderScaleSchema = z
  .strictObject({
    minimal: positiveNumberSchema.max(1),
    reduced: positiveNumberSchema.max(1),
    balanced: positiveNumberSchema.max(1),
    full: positiveNumberSchema.max(1),
  })
  .refine(
    ({ balanced, full, minimal, reduced }) =>
      minimal <= reduced && reduced <= balanced && balanced <= full,
    'Render scales must be ordered: minimal <= reduced <= balanced <= full.',
  );

/** Device-pixel bounds and the render scale assigned to each quality policy. */
const resolutionSchema = z.strictObject({
  pixelRatio: rangeSchema,
  renderScale: renderScaleSchema,
});

/** Rendering dimensions, supported aspect ratios, and resolution scaling policy. */
export const screenSchema = z
  .strictObject({
    orientations: z.strictObject({
      portrait: orientationSchema,
      landscape: orientationSchema,
    }),
    resolution: resolutionSchema,
  })
  .refine(
    ({ orientations }) => orientations.landscape.enabled || orientations.portrait.enabled,
    'At least one screen orientation must be enabled.',
  );
