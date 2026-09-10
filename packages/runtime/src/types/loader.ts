import type {
  AssetBundleName,
  AssetCategory,
  AssetMode,
  AssetSourceByCategory,
  LocaleDictionary,
} from '#types/assets.js';

/** Categories whose loading behavior is owned by Replayable. */
export type BuiltInAssetCategory = 'fonts' | 'locales' | 'shaders';

/** Categories whose loading behavior may be supplied by a rendering integration. */
export type RegisteredAssetCategory = Exclude<AssetCategory, BuiltInAssetCategory>;

/** Shader source pair after both generated files have been loaded as text. */
export interface LoadedShaderAsset {
  readonly frag: string;
  readonly vert: string;
}

/** Completed runtime value produced by each immutable built-in handler. */
export interface BuiltInAssetValueByCategory {
  readonly fonts: FontFace;
  readonly locales: LocaleDictionary;
  readonly shaders: LoadedShaderAsset;
}

/** One generated asset before category-specific runtime transformation. */
export interface AssetLoadContext<Category extends AssetCategory> {
  /** Build-selected representation used by generated physical files. */
  readonly assetMode: AssetMode;
  readonly category: Category;
  readonly id: string;
  readonly source: AssetSourceByCategory[Category];
}

/** Transforms one category's generated source into its cached runtime value. */
export type AssetLoadHandler<Category extends AssetCategory, Value = unknown> = (
  context: AssetLoadContext<Category>,
) => Promise<Value>;

/** One built-in asset after Replayable's category handler has completed. */
export interface AssetLoadedContext<
  Category extends BuiltInAssetCategory,
> extends AssetLoadContext<Category> {
  readonly value: BuiltInAssetValueByCategory[Category];
}

/** Observes the completed value produced by one immutable built-in handler. */
export type AssetLoadedListener<Category extends BuiltInAssetCategory> = (
  context: AssetLoadedContext<Category>,
) => void | Promise<void>;

/** Observes completion of one bundle load initiated elsewhere. */
export type AssetBundleLoadedListener = () => void | Promise<void>;

/**
 * Built-in loaders have fixed return types. Integration-owned categories remain
 * unknown because runtime does not know their renderer-specific objects.
 */
export type AssetValueByCategory = BuiltInAssetValueByCategory &
  Record<RegisteredAssetCategory, unknown>;

/** Completed values by category and ID; unloaded categories and IDs may be absent. */
export type AssetCache = {
  readonly [Category in AssetCategory]?: Readonly<Record<string, AssetValueByCategory[Category]>>;
};

/** Public contract for loading generated asset bundles into the runtime cache. */
export interface AssetLoader {
  /** Assets that completed their category-specific runtime loading. */
  readonly cache: AssetCache;
  /**
   * Loads a bundle once, including completion observers. Repeated calls share
   * the same promise, including a retained failure; this is not a reload API.
   */
  load(bundle: AssetBundleName): Promise<void>;
  /** Observes completion after every asset in one bundle has loaded. */
  onBundleLoaded(bundle: AssetBundleName, listener: AssetBundleLoadedListener): () => void;
  /** Observes values produced by Replayable's immutable built-in handlers. */
  onLoaded<Category extends BuiltInAssetCategory>(
    category: Category,
    listener: AssetLoadedListener<Category>,
  ): () => void;
  /** Installs the exclusive transformation handler for one asset category. */
  register<Category extends RegisteredAssetCategory>(
    category: Category,
    handler: AssetLoadHandler<Category>,
  ): () => void;
}

/** Mutable backing dictionaries; consumers receive the read-only AssetCache view. */
export type AssetCacheStorage = {
  [Category in AssetCategory]?: Record<string, AssetValueByCategory[Category]>;
};

export interface AssetLoadResult {
  readonly notifyLoaded?: () => Promise<void>;
  readonly value: unknown;
}

export interface AssetHandler<Category extends AssetCategory> {
  readonly load: (context: AssetLoadContext<Category>) => Promise<AssetLoadResult>;
}

export type AssetHandlers = {
  [Category in AssetCategory]?: AssetHandler<Category>;
};

export type BundleLoadedListeners = Partial<
  Record<AssetBundleName, Set<AssetBundleLoadedListener>>
>;

export type AssetLoadedListeners = {
  [Category in BuiltInAssetCategory]?: Set<AssetLoadedListener<Category>>;
};
