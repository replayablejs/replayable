import type { z } from 'zod';

import type { paramDefinitionSchema } from '#config/schemas/params.js';

/** Parameter validation contracts inferred from the authored schema. */
export type ParamDefinition = z.infer<typeof paramDefinitionSchema>;
export type ParamDefinitions = Record<string, ParamDefinition>;
export type NumberParamRange = Extract<ParamDefinition, { type: 'number' }>['range'];
export type ParamOverrideGroup = Record<
  string,
  { params?: Record<string, ParamDefinition['default']> | undefined }
>;
export type ValidationContext = z.RefinementCtx;
