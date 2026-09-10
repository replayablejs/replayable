import type { z } from 'zod';

import type { assetRuleSchema } from '#config/schemas/base.js';

/** Validated source-selection fields shared by every category resolver. */
export type AssetSelectionRule = z.infer<typeof assetRuleSchema>;
