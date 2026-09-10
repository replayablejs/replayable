import { assetConfigSchema } from '@replayablejs/assets';
import { z } from 'zod';

import { requiredStringSchema } from './base.js';

/**
 * Language-independent asset configuration authored as part of a project config.
 *
 * Replayable derives this contract from the assets package instead of
 * maintaining a second copy. Variant expansion adds each playable's fixed
 * language before producing the complete asset configuration.
 */
export const replayableAssetsSchema = assetConfigSchema.omit({ localization: true });

/** Asset changes that may be applied by one version or network. */
export const assetOverrideSchema = z.strictObject({
  exclude: z.array(requiredStringSchema).default([]),
});
