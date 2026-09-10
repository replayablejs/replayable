/**
 * Deterministic asset processing and typed runtime-module generation for web
 * playable ads.
 *
 * @example Define and build an assets configuration.
 *
 * ```ts
 * import { buildAssets, defineConfig } from '@replayablejs/assets';
 *
 * const config = defineConfig({
 *   assets: {
 *     sprites: [{ match: '**' }],
 *   },
 *   emit: {
 *     assets: 'src/assets/assets.gen.ts',
 *   },
 *   localization: {
 *     language: 'en',
 *     fallback: 'en',
 *   },
 *   outDir: 'assets/out',
 *   sourceDir: 'assets/source',
 * });
 *
 * await buildAssets(config);
 * ```
 *
 * @packageDocumentation
 */

export { buildAssets } from './build-assets.js';
export { defineConfig } from '#config/define-config.js';
export { assetConfigSchema } from '#config/schema.js';
export type {
  AtlasAssetOptions,
  FontAssetOptions,
  ImageAssetOptions,
  SoundAssetOptions,
  SpineAssetOptions,
} from '#types/asset-options.js';
export {
  assetCategories,
  groupedAssetCategories,
  simpleAssetCategories,
} from '#types/categories.js';
export type { AssetConfig, AssetConfigInput } from '#types/config.js';
export type { BuildAssetsResult } from '#types/build.js';
export { assetBundleNames } from '#types/bundles.js';
export type { AssetBundleName } from '#types/bundles.js';
export type {
  AssetCategory,
  GroupedAssetCategory,
  SimpleAssetCategory,
} from '#types/categories.js';
export type {
  AssetMode,
  Assets,
  AssetsInBundle,
  AtlasAsset,
  FontAsset,
  ImageAsset,
  JsonObject,
  JsonPrimitive,
  JsonValue,
  LocaleAsset,
  LocaleDictionary,
  ShaderAsset,
  SpineAsset,
} from '#types/runtime-assets.js';
