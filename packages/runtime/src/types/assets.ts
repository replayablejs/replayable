import type { assetBundleNames } from '#assets/bundles.js';
import type {
  assetCategories,
  groupedAssetCategories,
  simpleAssetCategories,
} from '#assets/categories.js';

/** Runtime bundle accepted by the playable asset loader. */
export type AssetBundleName = (typeof assetBundleNames)[number];

/** Runtime category whose logical asset originates from one source file. */
export type SimpleAssetCategory = (typeof simpleAssetCategories)[number];

/** Runtime category assembled from several related source files. */
export type GroupedAssetCategory = (typeof groupedAssetCategories)[number];

/** Any generated asset category understood by the playable runtime. */
export type AssetCategory = (typeof assetCategories)[number];

/** Build-selected representation of generated physical asset files. */
export type AssetMode = 'inline' | 'resource';

/** Primitive value supported by a generated JSON asset. */
export type JsonPrimitive = boolean | null | number | string;

/** Any value that can be represented in a generated JSON asset. */
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];

/** JSON object imported by the generated assets module. */
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

/** One generated atlas sheet and its selected texture file. */
export interface AtlasAsset {
  /** URL of the selected texture encoding. */
  readonly image: string;
  /** Parsed inline atlas layout or URL of an emitted JSON resource. */
  readonly json: JsonObject | string;
}

/** Runtime reference to one generated font file. */
export interface FontAsset {
  /** Configured CSS font-family name. */
  readonly family: string;
  /** URL of the generated WOFF2 file. */
  readonly src: string;
}

/** Runtime value emitted for one selected sprite or texture file. */
export interface ImageAsset {
  /** Scale applied while processing the source image. */
  readonly scale: number;
  /** URL of the selected encoded file. */
  readonly src: string;
}

/** Loaded fixed-language translations keyed by phrase ID. */
export type LocaleDictionary = Readonly<Record<string, string>>;

/** Parsed inline translations or URL of an emitted fixed-language dictionary. */
export type LocaleAsset = LocaleDictionary | string;

/** Runtime WebGL 2 shader source pair. */
export interface ShaderAsset {
  /** Inline fragment source or URL selected according to the runtime asset mode. */
  readonly frag: string;
  /** Inline vertex source or URL selected according to the runtime asset mode. */
  readonly vert: string;
}

/** Complete runtime Spine export. */
export interface SpineAsset {
  /** Inline Spine atlas description or URL of the emitted text resource. */
  readonly atlas: string;
  /** Generated skeleton representation selected from the authored source. */
  readonly format: 'json' | 'skel';
  /** Selected texture URLs ordered by atlas page index. */
  readonly images: readonly string[];
  /** Generated texture scale restored as Pixi source resolution at load time. */
  readonly scale: number;
  /** Parsed inline JSON skeleton or URL/data URL of a skeleton resource. */
  readonly skel: JsonObject | string;
}

/** Runtime assets available inside one generated bundle. */
export interface AssetsInBundle {
  /** Packed sprite sheets keyed by generated sheet ID. */
  readonly atlases?: Readonly<Record<string, AtlasAsset>>;
  /** Subset web fonts keyed by logical asset ID. */
  readonly fonts?: Readonly<Record<string, FontAsset>>;
  /** Inline or externally emitted fixed-language dictionaries keyed by logical asset ID. */
  readonly locales?: Readonly<Record<string, LocaleAsset>>;
  /** WebGL 2 shader pairs keyed by logical asset ID. */
  readonly shaders?: Readonly<Record<string, ShaderAsset>>;
  /** Selected audio-file URLs keyed by logical asset ID. */
  readonly sounds?: Readonly<Record<string, string>>;
  /** Spine skeletons keyed by logical asset ID. */
  readonly spines?: Readonly<Record<string, SpineAsset>>;
  /** Localized 2D images keyed by logical asset ID. */
  readonly sprites?: Readonly<Record<string, ImageAsset>>;
  /** General-purpose or 3D texture images keyed by logical asset ID. */
  readonly textures?: Readonly<Record<string, ImageAsset>>;
}

/** Generated source value received by the loader for each asset category. */
export type AssetSourceByCategory = {
  [Category in AssetCategory]: NonNullable<AssetsInBundle[Category]>[string];
};

/** Complete generated asset manifest consumed by one playable. */
export interface Assets {
  /** Assets available for initial playable loading. */
  readonly primary: AssetsInBundle;
  /** Optional assets intended for deferred loading. */
  readonly secondary?: AssetsInBundle;
}
