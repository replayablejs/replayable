import { z } from 'zod';

import { assetOverrideSchema } from './assets.js';
import { audioOverrideSchema } from './audio.js';
import { dimensionNameSchema } from './base.js';
import { completionOverrideSchema } from './completion.js';
import { paramOverridesSchema } from './params.js';
import { withUniqueTrimmedKeys } from './record.js';

/** Values that one version or network may override for its playable variants. */
const variantOverrideSchema = z.strictObject({
  assets: assetOverrideSchema.optional(),
  audio: audioOverrideSchema.optional(),
  completion: completionOverrideSchema.optional(),
  params: paramOverridesSchema.optional(),
});

/** Named versions normalized to the default version when omitted. */
export const versionsSchema = withUniqueTrimmedKeys(
  z.record(dimensionNameSchema, variantOverrideSchema),
)
  .refine((versions) => Object.keys(versions).length > 0, 'At least one version is required.')
  .default({ default: {} });

/** Delivery networks whose behavior is implemented internally by Replayable. */
export const networkSchema = z.enum([
  'preview',
  'applovin',
  'meta',
  'google',
  'liftoff',
  'mintegral',
  'moloco',
  'unity',
]);

/** Selected supported networks, normalized to local preview when omitted. */
export const networksSchema = z
  .partialRecord(networkSchema, variantOverrideSchema)
  .refine((networks) => Object.keys(networks).length > 0, 'At least one network is required.')
  .default({ preview: {} });
