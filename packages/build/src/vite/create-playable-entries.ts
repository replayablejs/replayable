import { resolveBuildRuntimeEntry } from '#runtime/resolve-build-runtime-entry.js';
import type { PlayableViteContext, PlayableViteEntries } from '#types/vite.js';

import { createApplicationViteConfig } from './create-application-vite-config.js';
import { createAssetsViteConfig } from './create-assets-vite-config.js';
import { createConfigViteConfig } from './create-config-vite-config.js';
import { createHostViteConfig } from './create-host-vite-config.js';

/**
 * Describes the four private module entries shared by development and production.
 *
 * Production builds each descriptor independently. Development merges their Vite
 * configuration into one live graph and serves the same inputs in execution order.
 */
export function createPlayableEntries(
  context: PlayableViteContext,
  command: 'build' | 'serve',
): PlayableViteEntries {
  const assetsEntry = resolveBuildRuntimeEntry('assets');

  return {
    host: {
      input: resolveBuildRuntimeEntry('host'),
      viteConfig: createHostViteConfig(context),
    },
    config: {
      input: resolveBuildRuntimeEntry('config'),
      viteConfig: createConfigViteConfig(context),
    },
    assets: {
      input: assetsEntry,
      viteConfig: createAssetsViteConfig(context),
    },
    application: {
      input: context.entryFile,
      viteConfig: createApplicationViteConfig(context, assetsEntry, command),
    },
  };
}
