import { assetCategories } from '#assets/categories.js';
import { loadFont } from '#loader/builtins/font.js';
import { loadLocale } from '#loader/builtins/locale.js';
import { loadShader } from '#loader/builtins/shader.js';
import type {
  AssetBundleName,
  AssetCategory,
  AssetMode,
  Assets,
  AssetsInBundle,
} from '#types/assets.js';
import type {
  AssetCacheStorage,
  AssetLoadResult,
  AssetHandler,
  AssetHandlers,
  BundleLoadedListeners,
  AssetLoadedListeners,
  AssetLoadedContext,
  AssetLoadContext,
  AssetLoadHandler,
  AssetLoader,
  BuiltInAssetCategory,
  BuiltInAssetValueByCategory,
  RegisteredAssetCategory,
} from '#types/loader.js';

/** Creates the runtime loader around one generated assets module. */
export function createAssetLoader(assets: Assets, assetMode: AssetMode): AssetLoader {
  const bundleLoads = new Map<AssetBundleName, Promise<void>>();
  const bundleLoadedListeners: BundleLoadedListeners = {};
  const cache: AssetCacheStorage = {};
  const loadedListeners: AssetLoadedListeners = {};
  const handlers: AssetHandlers = {
    fonts: createBuiltInHandler('fonts', loadFont),
    locales: createBuiltInHandler('locales', loadLocale),
    shaders: createBuiltInHandler('shaders', loadShader),
  };

  return {
    cache,

    load(bundle): Promise<void> {
      const existingLoad = bundleLoads.get(bundle);

      if (existingLoad !== undefined) {
        return existingLoad;
      }

      // Publish the promise before invoking handlers, which may request this
      // bundle themselves. Success and failure are retained: loading is not a
      // reload API, and retrying partial success could leak native resources.
      const loading = Promise.resolve().then(() => loadAndNotifyBundle(bundle));
      bundleLoads.set(bundle, loading);

      return loading;
    },

    onBundleLoaded(bundle, listener): () => void {
      const bundleListeners = bundleLoadedListeners[bundle] ?? new Set();

      bundleListeners.add(listener);
      bundleLoadedListeners[bundle] = bundleListeners;

      return () => {
        bundleListeners.delete(listener);
      };
    },

    onLoaded(category, listener): () => void {
      const categoryListeners = loadedListeners[category] ?? new Set();

      categoryListeners.add(listener);
      Object.assign(loadedListeners, { [category]: categoryListeners });

      return () => {
        categoryListeners.delete(listener);
      };
    },

    register(category, handler): () => void {
      return registerHandler(category, handler);
    },
  };

  /** Loads one bundle once, including its asynchronous completion observers. */
  async function loadAndNotifyBundle(bundle: AssetBundleName): Promise<void> {
    const bundleAssets = assets[bundle];

    if (bundleAssets !== undefined) {
      await loadBundle(bundleAssets);
    }

    await notifyBundleLoaded(bundle);
  }

  /** Loads every populated category in one generated bundle concurrently. */
  async function loadBundle(bundleAssets: AssetsInBundle): Promise<void> {
    await Promise.all(assetCategories.map((category) => loadCategory(bundleAssets, category)));
  }

  /** Adds completion notification to one immutable built-in handler. */
  function createBuiltInHandler<Category extends BuiltInAssetCategory>(
    category: Category,
    handler: AssetLoadHandler<Category, BuiltInAssetValueByCategory[Category]>,
  ): AssetHandler<Category> {
    return {
      async load(context): Promise<AssetLoadResult> {
        const value = await handler(context);

        return {
          value,
          notifyLoaded: () => notifyLoaded(category, { ...context, value }),
        };
      },
    };
  }

  /** Installs one replaceable integration handler for its registered category. */
  function registerHandler<Category extends RegisteredAssetCategory>(
    category: Category,
    handler: AssetLoadHandler<Category>,
  ): () => void {
    if (handlers[category] !== undefined) {
      throw new Error(`An asset loader handler is already registered for ${category}.`);
    }

    const assetHandler: AssetHandler<Category> = {
      async load(context): Promise<AssetLoadResult> {
        return { value: await handler(context) };
      },
    };

    Object.assign(handlers, { [category]: assetHandler });

    return () => {
      if (handlers[category] === assetHandler) {
        delete handlers[category];
      }
    };
  }

  /** Runs one category's built-in, registered, or pass-through loading behavior. */
  // The generic preserves the correlation between a category, its source, and
  // its handler even though it does not appear in the return type.
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters
  async function loadCategory<Category extends AssetCategory>(
    bundleAssets: AssetsInBundle,
    category: Category,
  ): Promise<void> {
    const categoryAssets = bundleAssets[category];

    if (categoryAssets === undefined) {
      return;
    }

    await Promise.all(
      Object.entries(categoryAssets).map(async ([id, source]) => {
        const context: AssetLoadContext<Category> = {
          assetMode,
          category,
          id,
          source,
        };
        const handler = handlers[category];

        if (handler === undefined) {
          cacheAsset(category, id, source);

          return;
        }

        const result = await handler.load(context);

        cacheAsset(category, id, result.value);
        await result.notifyLoaded?.();
      }),
    );
  }

  /** Stores one completed runtime value under its generated category and ID. */
  function cacheAsset(category: AssetCategory, id: string, value: unknown): void {
    // Asset IDs are dictionary keys, including names such as "__proto__".
    // A null prototype prevents those names from changing the cache itself.
    const categoryCache: Record<string, unknown> = cache[category] ?? { __proto__: null };

    categoryCache[id] = value;
    // Built-in handlers cannot be replaced, so their values retain the fixed
    // category types. Registered handlers and pass-through values stay unknown.
    Object.assign(cache, { [category]: categoryCache });
  }

  /** Awaits every observer after all categories in one bundle have loaded. */
  async function notifyBundleLoaded(bundle: AssetBundleName): Promise<void> {
    for (const listener of bundleLoadedListeners[bundle] ?? []) {
      await listener();
    }
  }

  /** Awaits every observer registered for one immutable built-in handler. */
  async function notifyLoaded<Category extends BuiltInAssetCategory>(
    category: Category,
    context: AssetLoadedContext<Category>,
  ): Promise<void> {
    for (const listener of loadedListeners[category] ?? []) {
      await listener(context);
    }
  }
}
