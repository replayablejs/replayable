import type { AssetBundleName } from './bundles.js';
import type { AssetCategory } from './categories.js';

/** One physical file owned by a processed runtime asset. */
export interface GeneratedFile<Format extends string> {
  /** Lowercase output extension without a leading dot. */
  readonly format: Format;
  /** Absolute path of the generated file. */
  readonly path: string;
}

/** Encoding selected for a generated runtime image. */
export type GeneratedImageFormat = 'avif' | 'jpg' | 'png' | 'webp';

/** Audio encodings generated as candidates and selected for runtime use. */
export type GeneratedAudioFormat = 'm4a' | 'mp3';

/** Fields shared by logical assets after processing. */
export interface ProcessedAssetBase<Category extends AssetCategory> {
  readonly bundle: AssetBundleName;
  readonly category: Category;
  /** Final key used beneath the runtime asset category. */
  readonly id: string;
}

/** One complete runtime atlas sheet. */
export interface ProcessedAtlasAsset extends ProcessedAssetBase<'atlases'> {
  readonly files: {
    readonly image: GeneratedFile<GeneratedImageFormat>;
    readonly json: GeneratedFile<'json'>;
  };
  /** Frame names retained from the packed Pixi layout for registry generation. */
  readonly frameNames: readonly string[];
}

/** One complete runtime shader program. */
export interface ProcessedShaderAsset extends ProcessedAssetBase<'shaders'> {
  readonly files: {
    readonly frag: GeneratedFile<'glsl'>;
    readonly vert: GeneratedFile<'glsl'>;
  };
}

/** One complete runtime Spine asset. */
export interface ProcessedSpineAsset extends ProcessedAssetBase<'spines'> {
  readonly files: {
    readonly atlas: GeneratedFile<'atlas'>;
    /** Texture pages in the order declared by the Spine atlas. */
    readonly images: readonly GeneratedFile<GeneratedImageFormat>[];
    readonly skeleton: GeneratedFile<'json' | 'skel'>;
  };
  /** Names extracted from the authored skeleton for registry generation. */
  readonly metadata: {
    readonly animationNames: readonly string[];
    readonly skinNames: readonly string[];
  };
  /** Normalized values needed when serializing the runtime Spine entry. */
  readonly runtime: { readonly scale: number };
}

/** One complete runtime font asset. */
export interface ProcessedFontAsset extends ProcessedAssetBase<'fonts'> {
  readonly file: GeneratedFile<'woff2'>;
  /** Validated runtime family name from the font rule. */
  readonly runtime: { readonly family: string };
}

/** One complete runtime sprite or texture asset. */
export type ProcessedImageAsset = {
  [Category in 'sprites' | 'textures']: ProcessedAssetBase<Category> & {
    readonly file: GeneratedFile<GeneratedImageFormat>;
    /** Normalized scale retained in the runtime image entry. */
    readonly runtime: { readonly scale: number };
  };
}['sprites' | 'textures'];

/** One compiled fixed-language locale dictionary. */
export interface ProcessedLocaleAsset extends ProcessedAssetBase<'locales'> {
  readonly file: GeneratedFile<'json'>;
  /** Top-level translation keys retained for locale registry generation. */
  readonly phraseIds: readonly string[];
}

/** One selected runtime audio asset. */
export interface ProcessedSoundAsset extends ProcessedAssetBase<'sounds'> {
  readonly file: GeneratedFile<GeneratedAudioFormat>;
}

export type ProcessedAsset =
  | ProcessedAtlasAsset
  | ProcessedFontAsset
  | ProcessedImageAsset
  | ProcessedLocaleAsset
  | ProcessedShaderAsset
  | ProcessedSoundAsset
  | ProcessedSpineAsset;
