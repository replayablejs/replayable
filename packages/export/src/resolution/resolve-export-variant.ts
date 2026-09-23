import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import type { PlayableVariant, ReplayableConfig } from '@replayablejs/config';

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
  config: Pick<ReplayableConfig, 'name' | 'export'>,
): Promise<ExportVariantContext> {
  const buildDirectory = join(directories.buildOutput, variant.id);
  const htmlFile = join(buildDirectory, PLAYABLE_HTML_FILE);

  await assertBuiltHtmlExists(variant.id, htmlFile);

  return {
    buildDirectory,
    outputFile: join(directories.exportOutput, resolveExportFileName(variant, config)),
    variant,
  };
}

/**
 * Selects the upload artifact name required by the destination network.
 *
 * Expand the project template, then append the network-owned extension.
 * The default remains "applovin_default_en.html" or "google_default_en.zip".
 */
function resolveExportFileName(
  variant: PlayableVariant,
  config: Pick<ReplayableConfig, 'name' | 'export'>,
): string {
  const values: Record<string, string> = {
    name: config.name,
    network: variant.network,
    version: variant.version,
    language: variant.localization.language,
  };
  // The config schema validates placeholders. Normalize each value before substitution
  // to preserve the existing treatment of punctuation in version and locale names.
  const expanded = config.export.filename.replace(/\{([^{}]+)\}/gu, (_, key: string) =>
    normalizeArtifactNameSegment(values[key]!),
  );
  const artifactName = normalizeArtifactNameSegment(expanded);

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
