import { resolve } from 'node:path';

import type { PlayableVariant } from '@replayablejs/config';

import type { ServePreviewOptions } from '#types/build.js';
import type { DevelopmentContext } from '#types/context.js';
import { createPlayableViteContext } from '#vite/create-playable-vite-context.js';

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 5173;

/** Resolves every path, profile, and server option needed by local development. */
export function createDevelopmentContext(
  variant: PlayableVariant,
  options: ServePreviewOptions,
): DevelopmentContext {
  const projectRoot = resolve(options.projectRoot);
  const viteContext = createPlayableViteContext({ projectRoot, variant });

  return {
    ...viteContext,
    profile: {
      ...viteContext.profile,
      // Development keeps every generated file visible in browser network tools.
      assetMode: 'resource',
    },
    host: options.host ?? DEFAULT_HOST,
    open: options.open ?? false,
    port: options.port ?? DEFAULT_PORT,
  };
}
