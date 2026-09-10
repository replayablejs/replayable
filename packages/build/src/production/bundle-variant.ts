import { build, type Rolldown } from 'vite';

import { PLAYABLE_BROWSER_TARGETS } from '#browser-targets';
import type { BundleOutput, EntryBuildOptions } from '#types/bundle.js';
import type { BuildContext } from '#types/context.js';
import type { PlayableViteEntry } from '#types/vite.js';
import { createBaseViteConfig } from '#vite/create-base-vite-config.js';
import { createPlayableEntries } from '#vite/create-playable-entries.js';

import { createBundleOutput } from './create-bundle-output.js';
import { validateApplicationModuleGraph } from './validate-application-module-graph.js';

/** Builds independently executable host, config, assets, and application entries. */
export async function bundleVariant(context: BuildContext): Promise<BundleOutput> {
  const entries = createPlayableEntries(context, 'build');
  const hostOutput = await buildEntry(context, entries.host, {
    emptyOutputDirectory: true,
    output: {
      codeSplitting: false,
      format: 'es',
    },
  });
  const configOutput = await buildEntry(context, entries.config, {
    emptyOutputDirectory: false,
    output: {
      codeSplitting: false,
      format: 'es',
    },
  });
  const assetsOutput = await buildEntry(context, entries.assets, {
    emptyOutputDirectory: false,
    output: {
      codeSplitting: false,
      format: 'es',
    },
  });
  const applicationOutput = await buildEntry(context, entries.application, {
    emptyOutputDirectory: false,
    output: {
      codeSplitting: context.profile.applicationMode === 'module-graph',
      format: 'es',
    },
  });

  validateApplicationModuleGraph(applicationOutput);

  return createBundleOutput(
    {
      host: hostOutput,
      config: configOutput,
      assets: assetsOutput,
      application: applicationOutput,
    },
    context.profile.applicationMode,
  );
}

/** Runs one role-specific Vite build into the shared variant directory. */
async function buildEntry(
  context: BuildContext,
  entry: PlayableViteEntry,
  options: EntryBuildOptions,
): Promise<Rolldown.RolldownOutput['output']> {
  const buildResult = await build({
    ...createBaseViteConfig(context.projectRoot),
    ...entry.viteConfig,
    base: './',
    build: {
      assetsInlineLimit: context.profile.assetMode === 'inline' ? Infinity : 0,
      // Playable profiles intentionally keep large entries together. Export
      // validation checks delivery size; Vite's web-app chunk heuristic does not.
      chunkSizeWarningLimit: Infinity,
      cssTarget: [...PLAYABLE_BROWSER_TARGETS],
      emptyOutDir: options.emptyOutputDirectory,
      outDir: context.outputDirectory,
      rolldownOptions: {
        input: entry.input,
        // Never ship output that Rolldown or Oxc could not confidently produce.
        // In particular, this turns target-compatibility warnings into build failures.
        onLog(level, log, defaultHandler): void {
          defaultHandler(level === 'warn' ? 'error' : level, log);
        },
        output: options.output,
      },
      target: [...PLAYABLE_BROWSER_TARGETS],
    },
  });

  if (!('output' in buildResult)) {
    throw new Error('Vite did not return a single playable build output.');
  }

  return buildResult.output;
}
