import type { AssetBundleName } from './bundles.js';
import type { AssetCategory } from './categories.js';
import type { ProcessedAsset } from './processed-assets.js';

/** Processed assets indexed without losing their category-specific type. */
export type AssetsByCategory = {
  readonly [Category in AssetCategory]: readonly Extract<ProcessedAsset, { category: Category }>[];
};

/** One runtime bundle with its processed assets separated by category. */
export interface AssetBundle {
  /** Runtime bundle name. */
  readonly name: AssetBundleName;
  /** Complete category buckets, including empty categories. */
  readonly categories: AssetsByCategory;
}

/** Canonically ordered processed assets prepared for every emitter. */
export interface AssetGroups {
  /** All processed assets grouped by category, independent of runtime bundles. */
  readonly categories: AssetsByCategory;
  /** Primary followed by a populated secondary bundle; assets are sorted by ID. */
  readonly bundles: readonly AssetBundle[];
}

/** Mutable form used only while the pipeline constructs an asset bundle. */
export type MutableAssetsByCategory = {
  [Category in AssetCategory]: Array<Extract<ProcessedAsset, { category: Category }>>;
};
