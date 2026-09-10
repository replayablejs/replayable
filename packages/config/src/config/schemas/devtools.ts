import { z } from 'zod';

import { statsSchema } from './stats.js';

/** Project-wide development tools; omitted tools remain disabled. */
export const devtoolsSchema = z
  .strictObject({
    stats: statsSchema,
    /** Development-only Escape shortcut and DOM Skip button; never included in exports. */
    endCardTrigger: z.boolean().default(false),
    /** Development-only audio toggle; omitted from every production build, including preview. */
    soundControl: z.boolean().default(false),
  })
  .prefault({});
