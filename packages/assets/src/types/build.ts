import type { AssetBundleName } from './bundles.js';

/** Summary returned after a successful assets build. */
export interface BuildAssetsResult {
  /** Emitted runtime bundles in loading order; primary is always present. */
  readonly bundles: readonly AssetBundleName[];
  /** Number of logical entries emitted into the runtime assets object. */
  readonly emittedAssets: number;
  /** Number of physical asset files written to the output directory. */
  readonly emittedFiles: number;
  /** Absolute directory containing the processed asset files. */
  readonly outputDirectory: string;
}
