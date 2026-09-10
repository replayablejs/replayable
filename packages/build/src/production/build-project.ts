import { rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { buildAssets } from '@replayablejs/assets';
import { createVariants, defineConfig, type ReplayableConfigInput } from '@replayablejs/config';

import { resolveOutputDirectory } from '#pipeline/resolve-output-directory.js';
import type { BuildProjectResult } from '#types/build.js';

import { buildVariant } from './build-variant.js';

/**
 * Builds every concrete variant configured by one Replayable project.
 *
 * Variants are built sequentially because their asset builds share generated
 * source paths. The project output is reset once so variants removed from the
 * configuration cannot leave stale playable directories behind.
 * The first variant is restored afterward as a deterministic baseline. This
 * does not isolate an active preview: build and development share asset paths.
 *
 * @param config - Human-authored or already validated Replayable configuration.
 * @param workingDirectory - Project directory used to resolve authored paths.
 */
export async function buildProject(
  config: ReplayableConfigInput,
  workingDirectory = process.cwd(),
): Promise<BuildProjectResult> {
  const validatedConfig = defineConfig(config);
  const projectRoot = resolve(workingDirectory);
  const outputDirectory = resolveOutputDirectory(projectRoot, validatedConfig.build.outDir);
  const configuredVariants = createVariants(validatedConfig);
  const canonicalVariant = configuredVariants[0];
  const variants = [];
  const errors: unknown[] = [];

  if (canonicalVariant === undefined) {
    throw new Error('A Replayable project must resolve at least one playable variant.');
  }

  await rm(outputDirectory, { force: true, recursive: true });

  try {
    for (const variant of configuredVariants) {
      variants.push(
        await buildVariant(variant, {
          outputDirectory: join(outputDirectory, variant.id),
          projectRoot,
        }),
      );
    }
  } catch (error) {
    errors.push(error);
  }

  try {
    // Restore a deterministic baseline, not the active preview's selection.
    // Builds share generated paths with development; running both concurrently
    // is not isolated, even when this final restoration succeeds.
    await buildAssets(canonicalVariant.assets, projectRoot);
  } catch (error) {
    errors.push(error);
  }

  if (errors.length === 1) {
    throw errors[0];
  }

  if (errors.length > 1) {
    throw new AggregateError(errors, 'Playable build and generated asset restoration both failed.');
  }

  return {
    outputDirectory,
    variants,
  };
}
