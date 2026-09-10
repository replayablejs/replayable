import type { InlineConfig } from 'vite';

import { createRuntimeDefine } from '#runtime/create-runtime-define.js';
import type { PlayableViteContext } from '#types/vite.js';

/** Creates Vite configuration for the resolved runtime definition only. */
export function createConfigViteConfig(options: PlayableViteContext): InlineConfig {
  return {
    define: createRuntimeDefine(options.variant, options.profile),
  };
}
