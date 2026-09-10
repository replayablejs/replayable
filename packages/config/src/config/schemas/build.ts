import { z } from 'zod';

import { requiredStringSchema } from './base.js';

/** Project-wide destinations used when producing playable output. */
export const buildSchema = z
  .strictObject({
    outDir: requiredStringSchema.default('dist'),
  })
  .prefault({});
