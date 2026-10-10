import { z } from 'zod';

import { previewOverridesSchema } from '../preview-overrides.js';
import { assetOverrideSchema } from './assets.js';
import { dimensionNameSchema } from './base.js';
import { withUniqueTrimmedKeys } from './record.js';
import { variantOverrideSchema } from './variants.js';

export const projectVersionSchema = variantOverrideSchema.extend({
  assets: assetOverrideSchema
    .extend({
      exclude: assetOverrideSchema.shape.exclude.unwrap().optional(),
    })
    .optional(),
});

/** Persistent editable values stored alongside replayable.config.ts. */
export const projectDataSchema = z.strictObject({
  schemaVersion: z.literal(1),
  versions: withUniqueTrimmedKeys(z.record(dimensionNameSchema, projectVersionSchema)).optional(),
  controls: previewOverridesSchema.shape.controls,
  devtools: previewOverridesSchema.shape.devtools,
});
