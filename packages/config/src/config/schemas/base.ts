import { z } from 'zod';

/** Non-empty authored text normalized by trimming surrounding whitespace. */
export const requiredStringSchema = z.string().trim().min(1);

/** Stable lowercase name accepted for a project-defined version. */
export const dimensionNameSchema = requiredStringSchema.regex(
  /^[a-z][a-z0-9_-]*$/,
  'Target names must begin with a lowercase letter and contain only lowercase letters, numbers, underscores, and hyphens.',
);

/** Finite numeric value greater than zero. */
export const positiveNumberSchema = z.number().positive();
