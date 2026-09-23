import { z } from 'zod';

import type { ExportFilename } from '../../types/export.js';
import { requiredStringSchema } from './base.js';

/** Filename templates never control directories or network-owned extensions. */
const filenameSchema = requiredStringSchema
  .refine(
    (value) => !/[\\/]/u.test(value),
    'Export filename must not contain directory separators.',
  )
  .refine(
    (value) => !/[{}]/u.test(value.replace(/\{(?:name|network|version|language)\}/gu, '')),
    'Export filename supports only {name}, {network}, {version}, and {language}.',
  )
  .refine(
    (value) => !/\.(?:html|zip)$/iu.test(value),
    'Omit the export extension; the network selects .html or .zip.',
  );

/** Project-wide export naming, with the existing naming convention as its default. */
export const exportSchema = z
  .strictObject({
    filename: z
      .union([filenameSchema, z.custom<ExportFilename>((value) => typeof value === 'function')])
      .default('{network}_{version}_{language}'),
  })
  .prefault({});
