import { createAdapter } from '#adapter';
import { assets } from '#assets';
import { definition } from '#definition';
import { createRuntime } from '#lifecycle/create-runtime.js';
import type { Playable } from '#types/runtime.js';

/** Public facade for the playable currently running in the browser. */
export const playable: Playable = createRuntime({
  adapter: createAdapter(),
  assets,
  definition,
});
