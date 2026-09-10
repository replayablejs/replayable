import { z } from 'zod';

import { assetRuleSchema } from './base.js';
import { losslessImageOptionsSchema, lossyImageOptionsSchema } from './image.js';

/** Texture-packing controls added to the shared image encoding policy. */
const atlasPackingOptionFields = {
  /** Removes transparent frame borders while preserving original bounds. */
  allowTrim: z.boolean().default(true),
  /** Allows frame rotation when it produces a tighter sheet. */
  allowRotation: z.boolean().default(true),
  /** Empty pixels placed between packed frames. */
  padding: z.number().int().min(0).default(2),
  /** Repeated edge pixels added around each packed frame. */
  extrude: z.number().int().min(0).default(0),
  /** Restricts generated sheet dimensions to powers of two. */
  powerOfTwo: z.boolean().default(false),
};

/** Image encoding and texture-packing options for generated atlas sheets. */
export const atlasOptionsSchema = z.union([
  lossyImageOptionsSchema.extend(atlasPackingOptionFields),
  losslessImageOptionsSchema.extend(atlasPackingOptionFields),
]);

/** Rule for directories of images packed into Pixi atlas sheets. */
export const atlasRuleSchema = assetRuleSchema.extend({
  options: atlasOptionsSchema.prefault({}),
});
