import { resolve } from 'node:path';

import { resolvePlayableProfile } from '#networks/network-profiles.js';
import { resolveAssetsModule } from '#runtime/resolve-assets-module.js';
import type { PlayableViteContext, PlayableViteContextOptions } from '#types/vite.js';

/** Resolves every shared input needed before configuring Vite. */
export function createPlayableViteContext(
  options: PlayableViteContextOptions,
): PlayableViteContext {
  return {
    entryFile: resolve(options.projectRoot, options.variant.entry),
    assetsModule: resolveAssetsModule(options.projectRoot, options.variant),
    profile: resolvePlayableProfile(options.variant),
    projectRoot: options.projectRoot,
    variant: options.variant,
  };
}
