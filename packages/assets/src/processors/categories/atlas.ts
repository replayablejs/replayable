import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { parsePixiAtlasLayout } from '#adapters/pixi-atlas-parser.js';
import { packAtlasSources } from '#adapters/texture-packer.js';
import { createAtlasSheetId } from '#pipeline/asset-identity.js';
import type { PackedAtlasSheet } from '#types/atlas-packing.js';
import type { ProcessedAtlasAsset } from '#types/processed-assets.js';
import type { ResolvedAtlasAsset } from '#types/resolved-assets.js';

import { writeSmallestImage } from '../image-encoder.js';

/**
 * Packs all source images in one logical atlas and writes its generated files.
 *
 * The texture-packer adapter returns validated PNG sheets with matching Pixi
 * layouts. Those PNGs are lossless intermediates rather than predetermined
 * runtime formats. Each one passes through the shared image encoder, which
 * keeps only the smallest applicable AVIF, WebP, JPEG, or PNG result.
 *
 * One packed sheet produces one processed runtime entry:
 *
 * ```text
 * ui -> [{ id: 'ui', files: { json, image } }]
 * ```
 *
 * When the source images exceed one sheet, the generated sheet names become
 * distinct runtime IDs while preserving their logical atlas directory:
 *
 * ```text
 * ui -> [
 *   { id: 'ui-0', files: { json, image } },
 *   { id: 'ui-1', files: { json, image } },
 * ]
 * ```
 */
export async function processAtlas(asset: ResolvedAtlasAsset): Promise<ProcessedAtlasAsset[]> {
  const { id, images } = asset.atlas;
  const packedSheets = await packAtlasSources(images, id, asset.options);

  return writeAtlasSheets(asset, packedSheets);
}

/** Writes validated sheets sequentially to limit peak image-encoding memory. */
async function writeAtlasSheets(
  asset: ResolvedAtlasAsset,
  sheets: readonly PackedAtlasSheet[],
): Promise<ProcessedAtlasAsset[]> {
  const processedSheets: ProcessedAtlasAsset[] = [];

  // Each sheet creates several large in-memory encoding candidates. Processing
  // sheets in parallel would multiply peak memory use for large playable ads.
  for (const sheet of sheets) {
    processedSheets.push(await writeAtlasSheet(asset, sheet));
  }

  return processedSheets;
}

/** Writes one validated sheet and returns its complete processed runtime value. */
async function writeAtlasSheet(
  asset: ResolvedAtlasAsset,
  sheet: PackedAtlasSheet,
): Promise<ProcessedAtlasAsset> {
  const jsonOutputPath = join(asset.outputDirectory, `${sheet.name}.json`);
  const imageOutputBasePath = join(asset.outputDirectory, sheet.name);
  const layout = parsePixiAtlasLayout(sheet.json.buffer);

  await writeAtlasLayout(layout.serializedJson, jsonOutputPath);

  // The packer already scaled both the sheet pixels and every frame coordinate
  // in its JSON layout. Scaling the intermediate texture again would make
  // those coordinates describe different pixels, so encoding must use scale 1.
  const image = await writeSmallestImage({
    input: sheet.png.buffer,
    options: { ...asset.options, scale: 1 },
    outputBasePath: imageOutputBasePath,
    sourcePath: `${asset.relativePath} (${sheet.name})`,
  });

  return {
    bundle: asset.bundle,
    category: 'atlases',
    files: {
      image,
      json: { format: 'json', path: jsonOutputPath },
    },
    frameNames: layout.frameNames,
    id: createAtlasSheetId(asset.atlas.id, sheet.name),
  };
}

/**
 * Writes the already-validated and minified Pixi layout for one atlas sheet.
 */
async function writeAtlasLayout(serializedJson: string, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serializedJson);
}
