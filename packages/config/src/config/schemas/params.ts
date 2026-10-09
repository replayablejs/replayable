import { z } from 'zod';

import type { ParamDefinitions, ParamOverrides } from '#types/params.js';

import { validateParamDefinitions } from '../validation/params.js';
import { requiredStringSchema } from './base.js';
import { colorParamValueSchema, scalarParamValueSchema } from './param-values.js';
import { withUniqueTrimmedKeys } from './record.js';

/** Another parameter value that controls when a parameter is relevant. */
const paramConditionSchema = z.strictObject({
  param: z.union([requiredStringSchema, z.tuple([requiredStringSchema, requiredStringSchema])]),
  equals: scalarParamValueSchema,
});

const metadataFields = {
  label: requiredStringSchema,
  info: requiredStringSchema.optional(),
  category: requiredStringSchema.optional(),
  when: paramConditionSchema.optional(),
};

/** Scalar controls shared by the root catalog and one-level object groups. */
export const scalarParamDefinitionSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('boolean'),
    default: z.boolean(),
    ...metadataFields,
  }),
  z.strictObject({
    type: z.literal('number'),
    default: z.number(),
    ...metadataFields,
  }),
  z.strictObject({
    type: z.literal('text'),
    default: z.string(),
    ...metadataFields,
  }),
  z.strictObject({
    type: z.literal('range'),
    default: z.number(),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    ...metadataFields,
  }),
  z.strictObject({
    type: z.literal('color'),
    default: colorParamValueSchema,
    ...metadataFields,
  }),
  z.strictObject({
    type: z.literal('select'),
    default: z.string().min(1),
    options: z
      .array(z.strictObject({ name: requiredStringSchema, value: z.string().min(1) }))
      .min(1),
    ...metadataFields,
  }),
]);

/** Studio-compatible controls, with object defaults derived solely from their children. */
export const paramDefinitionSchema = z.discriminatedUnion('type', [
  ...scalarParamDefinitionSchema.options,
  z.strictObject({
    type: z.literal('object'),
    parameters: withUniqueTrimmedKeys(
      z.record(requiredStringSchema, scalarParamDefinitionSchema),
    ).refine((parameters) => Object.keys(parameters).length > 0, 'At least one child is required.'),
    ...metadataFields,
  }),
]);

// Named boundary types keep generated declarations reusable instead of expanding
// every control's metadata at each input/output occurrence in the config schema.
export const paramsSchema: z.ZodDefault<z.ZodType<ParamDefinitions, ParamDefinitions>> =
  withUniqueTrimmedKeys(z.record(requiredStringSchema, paramDefinitionSchema))
    .superRefine(validateParamDefinitions)
    .default({});

export const paramOverridesSchema: z.ZodType<ParamOverrides, ParamOverrides> =
  withUniqueTrimmedKeys(
    z.record(
      requiredStringSchema,
      z.union([
        scalarParamValueSchema,
        withUniqueTrimmedKeys(z.record(requiredStringSchema, scalarParamValueSchema)),
      ]),
    ),
  );
