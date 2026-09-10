import type { AtlasOptions, FontOptions, ImageOptions, SoundOptions } from './asset-options.js';
import type { AssetBundleName } from './bundles.js';
import type { SourceFile } from './source.js';

/** Fields shared by every logical asset after source resolution. */
interface ResolvedAssetBase {
  /** Runtime bundle that will contain the asset. */
  readonly bundle: AssetBundleName;
  /** Stable logical source path used for diagnostics and runtime identity. */
  readonly relativePath: string;
}

/** Shared resolver output for categories backed by one physical source file. */
export interface ResolvedSimpleSource extends SourceFile {
  readonly bundle: AssetBundleName;
  /** Extensionless destination whose final format is chosen by processing. */
  readonly outputBasePath: string;
}

export interface ResolvedAtlasAsset extends ResolvedAssetBase {
  readonly atlas: ResolvedAtlas;
  readonly category: 'atlases';
  /** Validated texture-packing and image-output options. */
  readonly options: AtlasOptions;
  /** Directory that receives every generated atlas sheet. */
  readonly outputDirectory: string;
}

export interface ResolvedShaderAsset extends ResolvedAssetBase {
  readonly category: 'shaders';
  /** Directory that receives both generated shader stages. */
  readonly outputDirectory: string;
  readonly shader: ResolvedShader;
}

export interface ResolvedSpineAsset extends ResolvedAssetBase {
  readonly category: 'spines';
  /** Validated options applied to every texture page. */
  readonly options: ImageOptions;
  /** Directory that receives the skeleton, atlas, and texture pages. */
  readonly outputDirectory: string;
  readonly spine: ResolvedSpine;
}

export interface ResolvedFontAsset extends ResolvedSimpleSource {
  readonly category: 'fonts';
  /** Complete subset charset resolved from defaults, locales, and font options. */
  readonly charset: string;
  /** Validated subsetting and runtime metadata options. */
  readonly options: FontOptions;
}

export type ResolvedImageAsset = {
  [Category in 'sprites' | 'textures']: ResolvedSimpleSource & {
    readonly category: Category;
    /** Validated scaling and encoding options. */
    readonly options: ImageOptions;
  };
}['sprites' | 'textures'];

export interface ResolvedLocaleAsset extends ResolvedSimpleSource {
  readonly category: 'locales';
  /** Fixed-language values selected from the source dictionary. */
  readonly resolvedLocale: ResolvedLocaleDictionary;
}

export interface ResolvedSoundAsset extends ResolvedSimpleSource {
  readonly category: 'sounds';
  /** Validated audio encoding options. */
  readonly options: SoundOptions;
}

export type ResolvedSimpleAsset =
  | ResolvedFontAsset
  | ResolvedImageAsset
  | ResolvedLocaleAsset
  | ResolvedSoundAsset;

export type ResolvedAsset =
  | ResolvedAtlasAsset
  | ResolvedShaderAsset
  | ResolvedSpineAsset
  | ResolvedSimpleAsset;

export interface ResolvedAtlas {
  /** Runtime ID derived from the matched source directory. */
  readonly id: string;
  /** Absolute paths of all images that will be packed together. */
  readonly images: readonly string[];
}

export interface ResolvedSpine {
  /** Absolute path to the Spine atlas description. */
  readonly atlas: string;
  readonly id: string;
  /** Texture pages in the order declared by the Spine atlas. */
  readonly images: readonly string[];
  readonly skeleton: ResolvedSpineSkeleton;
}

/** JSON or binary skeleton source identified during Spine resolution. */
export interface ResolvedSpineSkeleton {
  readonly format: 'json' | 'skel';
  readonly path: string;
}

export interface ResolvedShader {
  readonly frag: string;
  readonly id: string;
  readonly vert: string;
}

/** Fixed-language phrase values selected during asset resolution. */
export type ResolvedLocaleDictionary = Readonly<Record<string, string>>;
