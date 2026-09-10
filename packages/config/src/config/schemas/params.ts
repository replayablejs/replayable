import { z } from 'zod';

import { validateParamDefinitions } from '../validation/params.js';
import { requiredStringSchema } from './base.js';
import { withUniqueTrimmedKeys } from './record.js';

const paramValueSchema = z.union([z.boolean(), z.number(), requiredStringSchema]);

/** Another parameter value that controls when a parameter is relevant. */
const paramConditionSchema = z.strictObject({
  param: requiredStringSchema,
  equals: paramValueSchema,
});

const paramDescriptionField = {
  description: requiredStringSchema,
};
const paramConditionField = {
  when: paramConditionSchema.optional(),
};

const numberRangeSchema = z.strictObject({
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
});

/** Boolean, number, and string parameters exposed to builds and development tools. */
export const paramDefinitionSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('boolean'),
    default: z.boolean(),
    ...paramDescriptionField,
    ...paramConditionField,
  }),
  z.strictObject({
    type: z.literal('number'),
    default: z.number(),
    ...paramDescriptionField,
    range: numberRangeSchema,
    ...paramConditionField,
  }),
  z.strictObject({
    type: z.literal('string'),
    default: requiredStringSchema,
    ...paramDescriptionField,
    options: z.array(requiredStringSchema).min(1),
    ...paramConditionField,
  }),
]);

export const paramsSchema = withUniqueTrimmedKeys(
  z.record(requiredStringSchema, paramDefinitionSchema),
)
  .superRefine(validateParamDefinitions)
  .default({});

export const paramOverridesSchema = withUniqueTrimmedKeys(
  z.record(requiredStringSchema, paramValueSchema),
);
