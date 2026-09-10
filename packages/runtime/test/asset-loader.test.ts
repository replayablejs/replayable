import { describe, expect, expectTypeOf, it, vi } from 'vitest';

import { createAssetLoader } from '../src/loader/create-asset-loader.js';
import type { Assets, LocaleDictionary } from '../src/types/assets.js';
import type { LoadedShaderAsset } from '../src/types/loader.js';

describe('asset cache types', () => {
  it('preserves built-in values while leaving integration values unknown', async () => {
    const shader = { vert: 'vertex source', frag: 'fragment source' };
    const dictionary = { greeting: 'Hello' };
    const loader = createAssetLoader(
      {
        primary: { shaders: { dissolve: shader }, locales: { translations: dictionary } },
      },
      'inline',
    );

    expectTypeOf(loader.cache.shaders?.dissolve).toEqualTypeOf<LoadedShaderAsset | undefined>();
    expectTypeOf(loader.cache.fonts?.body).toEqualTypeOf<FontFace | undefined>();
    expectTypeOf(loader.cache.locales?.translations).toEqualTypeOf<LocaleDictionary | undefined>();
    expectTypeOf(loader.cache.sprites?.hero).toEqualTypeOf<unknown>();
    expectTypeOf(loader.cache.sounds?.music).toEqualTypeOf<unknown>();
    expect(loader.cache.shaders).toBeUndefined();

    await loader.load('primary');
    expect(loader.cache.shaders?.dissolve).toEqual(shader);
    expect(loader.cache.locales?.translations).toEqual(dictionary);
  });
});

describe('asset loader bundle completion', () => {
  it('shares concurrent and completed loads without recreating resources or notifications', async () => {
    const result = Promise.withResolvers<unknown>();
    const handler = vi.fn<() => Promise<unknown>>(() => result.promise);
    const observer = vi.fn<() => void>();
    const loader = createAssetLoader({ primary: { sounds: { music: 'music.mp3' } } }, 'resource');
    loader.register('sounds', handler);
    loader.onBundleLoaded('primary', observer);

    const first = loader.load('primary');
    expect(loader.load('primary')).toBe(first);
    await Promise.resolve();
    expect(handler).toHaveBeenCalledOnce();

    const sound = {};
    result.resolve(sound);
    await first;
    expect(loader.load('primary')).toBe(first);
    await loader.load('primary');
    expect(handler).toHaveBeenCalledOnce();
    expect(observer).toHaveBeenCalledOnce();
    expect(loader.cache.sounds?.music).toBe(sound);
  });

  it('retains failed loads rather than recreating partially loaded resources', async () => {
    const failure = new Error('Sound decoding failed');
    const handler = vi.fn<() => Promise<unknown>>(() => Promise.reject(failure));
    const loader = createAssetLoader({ primary: { sounds: { music: 'music.mp3' } } }, 'resource');
    loader.register('sounds', handler);

    const loading = loader.load('primary');
    await expect(loading).rejects.toBe(failure);
    expect(loader.load('primary')).toBe(loading);
    await expect(loader.load('primary')).rejects.toBe(failure);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('keeps the bundle pending until asynchronous observers finish', async () => {
    const notification = Promise.withResolvers<void>();
    const loader = createAssetLoader({ primary: {} }, 'resource');
    const completed = vi.fn<() => void>();
    loader.onBundleLoaded('primary', () => notification.promise);
    const loading = loader.load('primary');
    void loading.then(completed);
    await Promise.resolve();
    expect(completed).not.toHaveBeenCalled();
    expect(loader.load('primary')).toBe(loading);
    notification.resolve();
    await loading;
    expect(completed).toHaveBeenCalledOnce();
  });

  it('stores prototype-like asset IDs as ordinary own entries', async () => {
    const source = { src: 'hero.png', width: 1, height: 1, scale: 1 };
    const loader = createAssetLoader(
      { primary: { sprites: { ['__proto__']: source, constructor: source } } },
      'resource',
    );
    await loader.load('primary');
    const sprites = loader.cache.sprites;
    expect(sprites).toBeDefined();
    expect(Object.getPrototypeOf(sprites)).toBeNull();
    expect(Object.hasOwn(sprites ?? {}, '__proto__')).toBe(true);
    expect(sprites?.['__proto__']).toBe(source);
    expect(sprites?.constructor).toBe(source);
  });

  it('notifies observers only after every asset in the bundle is cached', async () => {
    const soundLoad = Promise.withResolvers<unknown>();
    const listener = vi.fn<() => void>();
    const loader = createAssetLoader(
      {
        primary: {},
        secondary: {
          sounds: {
            effect: '/assets/effect.mp3',
          },
        },
      } satisfies Assets,
      'resource',
    );

    loader.register('sounds', () => soundLoad.promise);
    loader.onBundleLoaded('secondary', listener);

    const loading = loader.load('secondary');

    expect(listener).not.toHaveBeenCalled();
    expect(loader.cache.sounds).toBeUndefined();

    const loadedSound = {};
    soundLoad.resolve(loadedSound);
    await loading;

    expect(loader.cache.sounds?.effect).toBe(loadedSound);
    expect(listener).toHaveBeenCalledOnce();
  });
});
