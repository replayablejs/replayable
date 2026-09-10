import { Howl, type HowlErrorCallback } from '#audio/howler.js';
import type { AssetLoadContext, AssetLoader } from '#types/loader.js';

/** Returns one loaded sound, or `undefined` while its bundle remains unloaded. */
export function getLoadedSound(loader: AssetLoader, id: string): Howl | undefined {
  const sound = loader.cache.sounds?.[id];

  return sound instanceof Howl ? sound : undefined;
}

/**
 * Converts one generated sound URL into a completely loaded Howler sound.
 *
 * Replayable's asset loader calls this handler once for every sound in the
 * requested bundle. Given this context:
 *
 * ```ts
 * {
 *   category: 'sounds',
 *   id: 'ui-click',
 *   source: '/assets/ui-click.m4a',
 * }
 * ```
 *
 * the promise resolves with a `Howl` only after its `load` event. The asset
 * loader then stores that value at `cache.sounds['ui-click']`. Consequently,
 * `loader.load('primary')` does not finish until every primary sound is ready
 * for synchronous `play()` calls.
 *
 * A load failure unloads the partial Howler resource before rejecting the
 * containing bundle load with the generated asset ID in the error message.
 */
export function loadSound({ id, source }: AssetLoadContext<'sounds'>): Promise<Howl> {
  return new Promise((resolve, reject) => {
    // Manual loading lets Replayable attach both terminal listeners before any
    // network or data-URL decoding work can complete.
    const sound = new Howl({ preload: false, src: source });

    const handleLoad = (): void => {
      // The opposite terminal event can no longer occur for this load. Removing
      // it releases the settled promise closure retained by the cached Howl.
      sound.off('loaderror', handleLoadError);
      resolve(sound);
    };

    const handleLoadError: HowlErrorCallback = (_soundId, error): void => {
      sound.off('load', handleLoad);

      // Release any partially allocated HTMLAudio or Web Audio resources.
      sound.unload();
      reject(new Error(`Unable to load sound ${JSON.stringify(id)}: ${String(error)}.`));
    };

    sound.once('load', handleLoad);
    sound.once('loaderror', handleLoadError);
    sound.load();
  });
}
