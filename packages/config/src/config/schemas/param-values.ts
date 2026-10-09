import { z } from 'zod';

/** Value strings are preserved exactly; only names and display metadata are trimmed. */
export const scalarParamValueSchema = z.union([z.boolean(), z.number(), z.string()]);

/** Opaque RGB color shared by definition, override, and condition validation. */
export const colorParamValueSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Expected a six-digit RGB hex color.');
