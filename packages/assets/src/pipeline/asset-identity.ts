import { dirname, join } from 'node:path/posix';

import type { ProcessedAsset } from '#types/processed-assets.js';
import type { ResolvedSimpleAsset } from '#types/resolved-assets.js';

import { removeExtension } from './source-path.js';

/**
 * Rejects logical assets that would use the same generated runtime property.
 *
 * An ID is scoped by both bundle and category. `primary.sprites.logo` and
 * `secondary.sprites.logo` are independent, as are `primary.sprites.logo` and
 * `primary.textures.logo`. Generated file formats and physical file counts do
 * not participate because every processed record now represents one complete
 * runtime asset.
 */
export function assertUniqueRuntimeAssetIds(assets: readonly ProcessedAsset[]): void {
  const seen = new Set<string>();

  for (const asset of assets) {
    const key = JSON.stringify([asset.bundle, asset.category, asset.id]);

    if (seen.has(key)) {
      throw new Error(`Duplicate runtime asset ID: ${asset.bundle}:${asset.category}:${asset.id}`);
    }

    seen.add(key);
  }
}

/** Creates the final runtime ID used for one generated atlas sheet. */
export function createAtlasSheetId(atlasId: string, sheetName: string): string {
  // Preserve the logical atlas directory while replacing its source name with
  // the packer's generated sheet name:
  //
  //   createAtlasSheetId('ui/menu', 'menu')   -> 'ui/menu'
  //   createAtlasSheetId('ui/menu', 'menu-0') -> 'ui/menu-0'
  return join(dirname(atlasId), sheetName);
}

/** Derives the runtime ID shared by source and generated forms of a simple asset. */
export function createSimpleAssetId(
  asset: Pick<ResolvedSimpleAsset, 'category' | 'relativePath'>,
): string {
  const categoryPrefix = `${asset.category}/`;
  const categoryPath = asset.relativePath.startsWith(categoryPrefix)
    ? asset.relativePath.slice(categoryPrefix.length)
    : asset.relativePath;

  return removeExtension(categoryPath);
}
