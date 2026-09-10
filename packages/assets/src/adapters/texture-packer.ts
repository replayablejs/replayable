import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

import { packAsync, type ReplayableTexturePackerOptions } from 'free-tex-packer-core';

import type { AtlasOptions } from '#types/asset-options.js';
import type { AtlasPackerInput, PartialPackedAtlasSheet } from '#types/atlas-packing.js';
import type { PackedAtlasFile, PackedAtlasSheet } from '#types/atlas-packing.js';

/** Hard sheet boundary that limits generated texture dimensions and build memory. */
const MAX_ATLAS_SIZE = 2048;

const BASE_ATLAS_PACKER_OPTIONS = {
  // Bound sheet dimensions while allowing the packer to choose the used size.
  width: MAX_ATLAS_SIZE,
  height: MAX_ATLAS_SIZE,
  fixedSize: false,

  // Produce the optimal packing layout in the Pixi JSON representation.
  packer: 'OptimalPacker',
  exporter: 'Pixi',

  // Keep resizing and trimming behavior deterministic across builds.
  filter: 'none',
  scaleMethod: 'BILINEAR',
  trimMode: 'trim',

  // Apply deterministic content analysis before packing.
  alphaThreshold: 0,
  detectIdentical: true,

  // Generate stable frame names directly from authored source filenames.
  prependFolderName: false,
  removeFileExtension: true,
} satisfies ReplayableTexturePackerOptions;

/**
 * Reads and packs one logical atlas into validated in-memory sheets.
 *
 * `free-tex-packer-core` returns a flat file list. A small atlas normally
 * yields `name.json` and `name.png`; a multi-sheet atlas yields
 * `name-0.{json,png}`, `name-1.{json,png}`, and so on. This adapter converts
 * that third-party representation into complete JSON/PNG sheet pairs.
 *
 * @param imagePaths - Absolute source-image paths belonging to one logical atlas.
 * @param atlasId - Stable logical ID used as the generated texture basename.
 * @param options - Validated packing, scaling, padding, and trimming settings.
 * @returns Complete in-memory sheets ordered by their generated names.
 */
export async function packAtlasSources(
  imagePaths: readonly string[],
  atlasId: string,
  options: AtlasOptions,
): Promise<PackedAtlasSheet[]> {
  const images = await readAtlasSourceImages(imagePaths);
  const packerOptions = createTexturePackerOptions(atlasId, options);
  const files = await packAsync(images, packerOptions);

  return collectPackedAtlasSheets(files, atlasId);
}

/** Reads source images into the in-memory shape required by the texture packer. */
async function readAtlasSourceImages(paths: readonly string[]): Promise<AtlasPackerInput[]> {
  // Atlas resolution groups one authored directory at a time. Passing only the
  // basename keeps machine-specific absolute directories out of frame names.
  return Promise.all(
    paths.map(async (path) => ({ contents: await readFile(path), path: basename(path) })),
  );
}

/** Combines fixed adapter behavior with options resolved for one atlas. */
function createTexturePackerOptions(
  atlasId: string,
  options: AtlasOptions,
): ReplayableTexturePackerOptions {
  return {
    ...BASE_ATLAS_PACKER_OPTIONS,
    textureName: basename(atlasId),

    powerOfTwo: options.powerOfTwo,
    scale: options.scale,

    padding: options.padding,
    extrude: options.extrude,

    allowRotation: options.allowRotation,
    allowTrim: options.allowTrim,
  };
}

/**
 * Converts untrusted texture-packer output into complete atlas sheets.
 *
 * Replayable requires exactly one JSON layout and one PNG intermediate texture
 * with the same basename for every sheet. Validation happens before files are
 * written, so malformed packer output cannot leave a partially generated atlas
 * on disk.
 *
 * A single-sheet flat result:
 *
 * ```text
 * ui.json, ui.png
 * ```
 *
 * becomes one `{ name: 'ui', json, png }` value. A split result:
 *
 * ```text
 * ui-1.png, ui-0.json, ui-0.png, ui-1.json
 * ```
 *
 * becomes two complete values ordered as `ui-0`, then `ui-1`, regardless of
 * the third-party file order.
 *
 * @param files - Flat files returned by `free-tex-packer-core`.
 * @param atlasId - Logical atlas ID used in validation diagnostics.
 * @returns Complete sheets sorted by generated sheet name.
 * @throws When output is empty, has an unsupported extension, repeats a file
 * role, or omits either member of a JSON/PNG pair.
 */
export function collectPackedAtlasSheets(
  files: readonly PackedAtlasFile[],
  atlasId: string,
): PackedAtlasSheet[] {
  const partialSheets = new Map<string, PartialPackedAtlasSheet>();

  for (const file of files) {
    const extension = extname(file.name).slice(1).toLowerCase();
    const sheetName = basename(file.name, extname(file.name));
    const sheet = partialSheets.get(sheetName) ?? {};

    switch (extension) {
      case 'json':
        if (sheet.json !== undefined) {
          throw new Error(`Atlas ${atlasId} sheet ${sheetName} has duplicate JSON layouts.`);
        }

        sheet.json = file;
        break;
      case 'png':
        if (sheet.png !== undefined) {
          throw new Error(`Atlas ${atlasId} sheet ${sheetName} has duplicate PNG textures.`);
        }

        sheet.png = file;
        break;
      default:
        throw new Error(`Atlas ${atlasId} produced unsupported file ${file.name}.`);
    }

    partialSheets.set(sheetName, sheet);
  }

  if (partialSheets.size === 0) {
    throw new Error(`Atlas ${atlasId} produced no sheets.`);
  }

  return [...partialSheets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, sheet]) => {
      if (sheet.json === undefined || sheet.png === undefined) {
        throw new Error(`Atlas ${atlasId} sheet ${name} must contain one JSON and one PNG file.`);
      }

      return { json: sheet.json, name, png: sheet.png };
    });
}
