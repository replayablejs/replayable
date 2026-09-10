import type { InlineConfig } from 'vite';

import { resolveRuntimeAdapter } from '#runtime/resolve-runtime-adapter.js';
import type { PlayableViteContext } from '#types/vite.js';

/** Creates Vite configuration for the profile-selected network host only. */
export function createHostViteConfig(options: PlayableViteContext): InlineConfig {
  return {
    resolve: {
      alias: {
        '#selected-adapter': resolveRuntimeAdapter(options.profile.runtime),
      },
    },
  };
}
