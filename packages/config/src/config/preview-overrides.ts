import { z } from 'zod';

import { dimensionNameSchema, requiredStringSchema } from './schemas/base.js';
import { controlsSchema } from './schemas/controls.js';
import { devtoolsSchema } from './schemas/devtools.js';
import { paramOverridesSchema } from './schemas/params.js';
import { statsSchema } from './schemas/stats.js';

/** Optional preview preferences do not fill defaults over authored project values. */
export const previewOverridesSchema = z.strictObject({
  version: dimensionNameSchema.optional(),
  language: requiredStringSchema.optional(),
  params: paramOverridesSchema.optional(),
  controls: z
    .strictObject({
      persistentCta: controlsSchema.unwrap().shape.persistentCta.unwrap().optional(),
    })
    .optional(),
  devtools: z
    .strictObject({
      stats: statsSchema.optional(),
      endCardTrigger: devtoolsSchema.unwrap().shape.endCardTrigger.unwrap().optional(),
      soundControl: devtoolsSchema.unwrap().shape.soundControl.unwrap().optional(),
    })
    .optional(),
});

/** Temporary local-preview input; never persisted into the project configuration. */
export type ReplayablePreviewOverrides = z.input<typeof previewOverridesSchema>;
