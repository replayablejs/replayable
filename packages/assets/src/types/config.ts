import type { z } from 'zod';

import type { assetConfigSchema, localizationSchema } from '#config/schema.js';

/** Fixed build language and fallback after validation and trimming. */
export type LocalizationConfig = z.infer<typeof localizationSchema>;

/** Validated asset configuration with every schema default applied. */
export type AssetConfig = z.infer<typeof assetConfigSchema>;

/** Author-written asset configuration accepted before defaults are applied. */
export type AssetConfigInput = z.input<typeof assetConfigSchema>;
