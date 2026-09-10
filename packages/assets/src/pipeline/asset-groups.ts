import type { MutableAssetsByCategory } from '#types/asset-groups.js';
import type { AssetBundle, AssetGroups } from '#types/asset-groups.js';
import { assetBundleNames, type AssetBundleName } from '#types/bundles.js';
import { assetCategories } from '#types/categories.js';
import type { ProcessedAsset } from '#types/processed-assets.js';

/**
 * Organizes the flat processing result before it enters the emitter layer.
 *
 * Processors intentionally return independent asset records. The assets module
 * needs bundles containing categories, while registries need categories across
 * the complete build. This transition constructs both views once so emitters
 * can render without regrouping or sorting.
 *
 * For these processed records:
 *
 * ```ts
 * [
 *   { bundle: 'secondary', category: 'sprites', id: 'logo', ... },
 *   { bundle: 'primary', category: 'sounds', id: 'click', ... },
 *   { bundle: 'primary', category: 'sprites', id: 'background', ... },
 * ]
 * ```
 *
 * the returned bundle hierarchy is equivalent to:
 *
 * ```text
 * primary
 *   sounds  -> [click]
 *   sprites -> [background]
 * secondary
 *   sprites -> [logo]
 * ```
 *
 * The parallel category view contains `sounds -> [click]` and
 * `sprites -> [background, logo]`, without bundle boundaries.
 *
 * Primary is always created, even when it contains no assets. Secondary is
 * included only when at least one processed asset belongs to it. Only references
 * are reorganized; processed asset records are not copied or changed.
 *
 * @param processedAssets - Flat logical runtime assets produced by processing.
 * @returns Assets grouped and ordered for deterministic source generation.
 */
export function groupAssets(processedAssets: readonly ProcessedAsset[]): AssetGroups {
  const allCategories = createEmptyCategories();
  const mutableBundles = new Map<AssetBundleName, MutableAssetsByCategory>([
    ['primary', createEmptyCategories()],
  ]);

  for (const asset of processedAssets) {
    addAsset(allCategories, asset);

    let categories = mutableBundles.get(asset.bundle);

    if (categories === undefined) {
      categories = createEmptyCategories();
      mutableBundles.set(asset.bundle, categories);
    }

    addAsset(categories, asset);
  }

  const bundles: AssetBundle[] = [];

  for (const name of assetBundleNames) {
    const categories = mutableBundles.get(name);

    if (categories === undefined) {
      continue;
    }

    sortCategoryAssets(categories);
    bundles.push({ name, categories });
  }

  sortCategoryAssets(allCategories);

  return { bundles, categories: allCategories };
}

/** Sorts every category bucket by runtime ID for deterministic source output. */
function sortCategoryAssets(categories: MutableAssetsByCategory): void {
  for (const category of assetCategories) {
    categories[category].sort((left, right) => left.id.localeCompare(right.id));
  }
}

/**
 * Creates the complete set of typed category buckets for one new bundle.
 * Keeping this object explicit makes TypeScript require a bucket whenever a
 * new asset category is added.
 */
function createEmptyCategories(): MutableAssetsByCategory {
  return {
    atlases: [],
    fonts: [],
    locales: [],
    shaders: [],
    sounds: [],
    spines: [],
    sprites: [],
    textures: [],
  };
}

/**
 * Adds one discriminated processed asset to its matching typed bucket.
 *
 * The exhaustive switch narrows each union member before writing it. A dynamic
 * `categories[asset.category].push(asset)` loses that relationship in
 * TypeScript and requires an unsafe assertion.
 */
function addAsset(categories: MutableAssetsByCategory, asset: ProcessedAsset): void {
  switch (asset.category) {
    case 'atlases':
      categories.atlases.push(asset);
      break;
    case 'fonts':
      categories.fonts.push(asset);
      break;
    case 'locales':
      categories.locales.push(asset);
      break;
    case 'shaders':
      categories.shaders.push(asset);
      break;
    case 'sounds':
      categories.sounds.push(asset);
      break;
    case 'spines':
      categories.spines.push(asset);
      break;
    case 'sprites':
      categories.sprites.push(asset);
      break;
    case 'textures':
      categories.textures.push(asset);
      break;
    default:
      return asset satisfies never;
  }
}
