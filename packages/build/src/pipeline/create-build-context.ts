import { join, resolve } from 'node:path';

import type { PlayableVariant } from '@replayablejs/config';

import { PLAYABLE_HTML_FILE } from '#html/playable-html.js';
import type { BuildVariantOptions } from '#types/build.js';
import type { BuildContext } from '#types/context.js';
import { createPlayableViteContext } from '#vite/create-playable-vite-context.js';

import { resolveOutputDirectory } from './resolve-output-directory.js';

/** Resolves every authored and generated path needed to build one variant. */
export function createBuildContext(
  variant: PlayableVariant,
  options: BuildVariantOptions,
): BuildContext {
  const projectRoot = resolve(options.projectRoot);
  const outputDirectory = resolveOutputDirectory(projectRoot, options.outputDirectory);
  const viteContext = createPlayableViteContext({
    projectRoot,
    variant,
  });

  return {
    ...viteContext,
    outputDirectory,
    htmlFile: join(outputDirectory, PLAYABLE_HTML_FILE),
  };
}
