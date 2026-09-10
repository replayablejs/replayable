import { resolve } from 'node:path';

import { createVariants, defineConfig, type ReplayableConfigInput } from '@replayablejs/config';

import type { ExportProjectContext, ExportVariantContext } from '#types/context.js';
import type { ExportProjectOptions } from '#types/export.js';

import { resolveExportDirectories } from './resolve-export-directories.js';
import { resolveExportVariant } from './resolve-export-variant.js';

/**
 * Resolves every existing variant build and its future export destination.
 *
 * This read-only stage parses the project configuration, validates the build and
 * export roots, verifies every expected build, and returns paths for preparation
 * and emission. It neither rebuilds variants nor changes existing exports.
 */
export async function resolveExportProject(
  input: ReplayableConfigInput,
  options: ExportProjectOptions,
): Promise<ExportProjectContext> {
  const config = defineConfig(input);
  const projectRoot = resolve(options.projectRoot);
  const directories = await resolveExportDirectories(
    projectRoot,
    config.build.outDir,
    options.outputDirectory,
  );
  const variants = await Promise.all(
    createVariants(config).map((variant) => resolveExportVariant(directories, variant)),
  );

  assertUniqueOutputFiles(variants);

  return {
    outputDirectory: directories.exportOutput,
    variants,
  };
}

/** Rejects variants whose normalized names would overwrite the same delivery artifact. */
function assertUniqueOutputFiles(variants: readonly ExportVariantContext[]): void {
  const variantByOutputFile = new Map<string, string>();

  for (const variant of variants) {
    const existingVariantId = variantByOutputFile.get(variant.outputFile);

    if (existingVariantId !== undefined) {
      throw new Error(
        `Export variants ${existingVariantId} and ${variant.variant.id} resolve to the same output file: ${variant.outputFile}.`,
      );
    }

    variantByOutputFile.set(variant.outputFile, variant.variant.id);
  }
}
