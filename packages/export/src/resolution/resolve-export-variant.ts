import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import type { PlayableVariant } from '@replayablejs/config';

import { isMissingPathError } from '#shared/filesystem-error.js';
import { PLAYABLE_HTML_FILE } from '#shared/playable-html.js';
import type { ExportVariantContext } from '#types/context.js';
import type { ExportDirectories } from '#types/directories.js';

/**
 * Resolves the existing build and future artifact paths for one variant.
 *
 * For example, the build "dist/default/google/en/index.html" becomes the
 * delivery artifact "exports/google_default_en.zip".
 * This function verifies the build but does not create the export directory.
 */
export async function resolveExportVariant(
  directories: ExportDirectories,
  variant: PlayableVariant,
): Promise<ExportVariantContext> {
  const buildDirectory = join(directories.buildOutput, variant.id);
  const htmlFile = join(buildDirectory, PLAYABLE_HTML_FILE);

  await assertBuiltHtmlExists(variant.id, htmlFile);

  return {
    buildDirectory,
    outputFile: join(directories.exportOutput, resolveExportFileName(variant)),
    variant,
  };
}

/**
 * Selects the upload artifact name required by the destination network.
 *
 * Every name identifies its network, version, and language, such as
 * "applovin_default_en.html" or "google_default_en.zip".
 */
function resolveExportFileName(variant: PlayableVariant): string {
  const artifactName = [variant.network, variant.version, variant.localization.language]
    .map(normalizeArtifactNameSegment)
    .join('_');

  switch (variant.network) {
    case 'applovin':
    case 'meta':
    case 'moloco':
    case 'preview':
    case 'unity':
      return `${artifactName}.html`;
    case 'google':
    case 'liftoff':
    case 'mintegral':
      return `${artifactName}.zip`;
    default:
      throw new Error(`Unsupported export network: ${String(variant.network)}.`);
  }
}

/** Produces a portable artifact-name segment containing letters, digits, and underscores. */
function normalizeArtifactNameSegment(value: string): string {
  const segment = value
    .toLowerCase()
    .replace(/[^a-z\d]+/gu, '_')
    .replace(/^_+|_+$/gu, '');

  return segment === '' ? 'playable' : segment;
}

/** Verifies that export consumes a completed build rather than rebuilding implicitly. */
async function assertBuiltHtmlExists(variantId: string, htmlFile: string): Promise<void> {
  try {
    const file = await stat(htmlFile);

    if (file.isFile()) {
      return;
    }
  } catch (error) {
    if (isMissingPathError(error)) {
      throw new Error(
        `Missing build for ${variantId}. Run replayable build before replayable export.`,
        { cause: error },
      );
    }

    throw new Error(`Unable to inspect build for ${variantId}: ${htmlFile}.`, { cause: error });
  }

  throw new Error(`Build output for ${variantId} is not an HTML file: ${htmlFile}.`);
}
