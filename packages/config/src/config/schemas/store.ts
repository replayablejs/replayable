import { z } from 'zod';

import { requiredStringSchema } from './base.js';

/** Platform destinations opened when the playable's call to action is activated. */
export const storeSchema = z.strictObject({
  androidUrl: requiredStringSchema.pipe(z.url()),
  iosUrl: requiredStringSchema.pipe(z.url()),
});
