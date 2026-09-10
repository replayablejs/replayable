import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { createWoff2Subset } from '#adapters/font-subsetter.js';
import { createSimpleAssetId } from '#pipeline/asset-identity.js';
import type { ProcessedFontAsset } from '#types/processed-assets.js';
import type { ResolvedFontAsset } from '#types/resolved-assets.js';

/**
 * Subsets and converts one source font into WOFF2.
 *
 * Resolution has already constructed the complete charset from printable
 * ASCII, fixed-language locale values, and font-specific extra characters.
 * TTF, OTF, WOFF, and WOFF2 sources all produce the same WOFF2 output shape.
 * The runtime family is authored configuration; Replayable does not infer or
 * rewrite it from the font's internal metadata.
 *
 * For example:
 *
 * ```text
 * Source:
 *   fonts/ui.ttf
 *   family: Replayable UI
 *   charset: printable ASCII + selected locale characters
 *
 * Generated:
 *   fonts/ui.woff2
 *
 * Processed entry:
 *   {
 *     id: 'ui',
 *     file: { format: 'woff2', path: '.../fonts/ui.woff2' },
 *     runtime: { family: 'Replayable UI' },
 *   }
 * ```
 *
 * The processor returns a one-entry array because the shared dispatcher uses
 * one batch shape for singleton assets and atlases that may generate several
 * sheets.
 */
export async function processFont(asset: ResolvedFontAsset): Promise<ProcessedFontAsset[]> {
  const { family } = asset.options;
  const outputPath = `${asset.outputBasePath}.woff2`;
  const woff2Subset = await createWoff2Subset(asset.absolutePath, asset.charset);

  await writeFontFile(outputPath, woff2Subset);

  return [
    {
      bundle: asset.bundle,
      category: 'fonts',
      file: { format: 'woff2', path: outputPath },
      id: createSimpleAssetId(asset),
      runtime: { family },
    },
  ];
}

/** Writes the generated WOFF2 file, creating its output directory when needed. */
async function writeFontFile(outputPath: string, contents: Uint8Array): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, contents);
}
