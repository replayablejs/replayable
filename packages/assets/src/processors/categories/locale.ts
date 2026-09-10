import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { createSimpleAssetId } from '#pipeline/asset-identity.js';
import type { ProcessedLocaleAsset } from '#types/processed-assets.js';
import type { ResolvedLocaleAsset } from '#types/resolved-assets.js';

/**
 * Writes one locale dictionary that was fixed to the build language during resolution.
 *
 * This processor does not parse JSONC or choose translations. Locale resolution
 * has already performed those operations and supplied only the selected value
 * for each phrase. For example, an Armenian build may reach this processor as:
 *
 * ```ts
 * {
 *   play: 'Խաղալ',
 *   install: 'Install', // Armenian was absent, so English was selected.
 * }
 * ```
 *
 * A source named `translations.jsonc` is emitted as runtime-ready
 * `translations.json`. Its top-level phrase IDs are retained beside the file
 * descriptor so registry emission does not need to read and parse that
 * generated JSON again:
 *
 * ```ts
 * {
 *   id: 'translations',
 *   file: { format: 'json', path: '.../locales/translations.json' },
 *   phraseIds: ['play', 'install'],
 * }
 * ```
 *
 * The returned one-item array follows the common processor contract: one
 * resolved locale asset produces one processed file.
 */
export async function processLocale(asset: ResolvedLocaleAsset): Promise<ProcessedLocaleAsset[]> {
  const outputPath = `${asset.outputBasePath}.json`;
  const serializedLocale = JSON.stringify(asset.resolvedLocale);
  const phraseIds = Object.keys(asset.resolvedLocale);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serializedLocale);

  return [
    {
      bundle: asset.bundle,
      category: 'locales',
      file: { format: 'json', path: outputPath },
      id: createSimpleAssetId(asset),
      phraseIds,
    },
  ];
}
