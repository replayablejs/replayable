import type { AssetGroups } from '#types/asset-groups.js';
import type { BuildAssetsResult } from '#types/build.js';
import { assetCategories } from '#types/categories.js';
import type { BuildContext } from '#types/context.js';
import type { ProcessedAsset } from '#types/processed-assets.js';

/** Summarizes the logical assets and physical files produced by a successful build. */
export function createBuildResult(
  context: BuildContext,
  assetGroups: AssetGroups,
): BuildAssetsResult {
  let emittedAssets = 0;
  let emittedFiles = 0;

  for (const bundle of assetGroups.bundles) {
    for (const category of assetCategories) {
      for (const asset of bundle.categories[category]) {
        emittedAssets += 1;
        emittedFiles += countGeneratedFiles(asset);
      }
    }
  }

  return {
    bundles: assetGroups.bundles.map((bundle) => bundle.name),
    emittedAssets,
    emittedFiles,
    outputDirectory: context.outputRoot,
  };
}

/** Counts the physical files owned by one complete runtime asset. */
function countGeneratedFiles(asset: ProcessedAsset): number {
  switch (asset.category) {
    case 'atlases':
    case 'shaders':
      return 2;
    case 'spines':
      return asset.files.images.length + 2;
    case 'fonts':
    case 'locales':
    case 'sounds':
    case 'sprites':
    case 'textures':
      return 1;
    default:
      return asset satisfies never;
  }
}
