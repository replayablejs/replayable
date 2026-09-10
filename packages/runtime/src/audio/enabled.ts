import { createHowlerLifecycle } from '#audio/howler-lifecycle.js';
import type { Howl } from '#audio/howler.js';
import { createManagedPlayback } from '#audio/managed-playback.js';
import { resolveAudioOneShotOptions, resolveAudioPlaybackOptions } from '#audio/resolve-options.js';
import { getLoadedSound, loadSound } from '#audio/sound-loader.js';
import type {
  AudioController,
  AudioPlayback,
  ManagedAudioPlayback,
  RuntimeAudioState,
} from '#types/audio.js';
import type { AssetLoader } from '#types/loader.js';

/**
 * Creates Howler-backed sound playback for an audio-enabled variant.
 *
 * This controller coordinates three lower-level components:
 *
 * - The asset loader turns generated sound URLs into loaded `Howl` instances.
 * - The lifecycle applies host volume, visibility, and browser-unlock policy.
 * - Managed playbacks own individual voices, fades, and final cleanup.
 *
 * There is only one playback implementation (`ManagedAudioPlayback`).
 * The two internal collections below represent states of the same type:
 * 1) `managedPlaybacks` keeps every live handle.
 * 2) `unresolvedPlaybacks` indexes pending handles still missing a loaded sound.
 *
 * A managed `play()` request is retained until both gates open:
 * - sound is loaded
 * - runtime audio is allowed
 *
 * Either gate can open first. A transient `playOneShot()` is dropped while
 * audio is blocked, preventing stale effects from playing later.
 */
export function createAudio(loader: AssetLoader): AudioController {
  const lifecycle = createHowlerLifecycle();
  // All live handles from `play()`: pending or active.
  const managedPlaybacks = new Set<ManagedAudioPlayback>();
  // Pending-by-sound-id index for quick binding when a sound finishes loading.
  const unresolvedPlaybacks = new Map<string, Set<ManagedAudioPlayback>>();
  let allowed = false;
  let muted = false;
  let runtimeState: RuntimeAudioState | undefined;

  // Registering this loader callback keeps primary/secondary asset timing safe.
  loader.register('sounds', async (context) => {
    const sound = await loadSound(context);

    resolveSound(context.id, sound);

    return sound;
  });

  return {
    get muted(): boolean {
      return muted;
    },

    setMuted(nextMuted): void {
      if (muted === nextMuted) {
        return;
      }

      muted = nextMuted;

      if (runtimeState !== undefined) {
        lifecycle.update(runtimeState, muted);
      }
    },

    play(id, options): AudioPlayback {
      const resolvedOptions = resolveAudioPlaybackOptions(options);
      const playback = createManagedPlayback(resolvedOptions, (finishedPlayback) => {
        removeManagedPlayback(id, finishedPlayback);
      });
      const sound = getLoadedSound(loader, id);

      if (sound === undefined) {
        retainUnresolvedPlayback(id, playback);
      } else {
        playback.setSound(sound);
      }

      managedPlaybacks.add(playback);

      // `start()` re-checks gates for both already-ready and newly-ready cases.
      startIfAllowed(playback);

      return playback;
    },

    playOneShot(id, options): void {
      // A one-shot has no retained handle: blocked effects are intentionally
      // discarded rather than queued and replayed out of context later.
      if (!allowed) {
        return;
      }

      const sound = getLoadedSound(loader, id);

      // Unloaded one-shots are dropped intentionally and are never deferred.
      if (sound === undefined) {
        return;
      }

      const { volume } = resolveAudioOneShotOptions(options);
      const playbackId = sound.play();

      sound.volume(volume, playbackId);
    },

    setVisible(visible): void {
      lifecycle.setVisible(visible);
    },

    update(state): void {
      const becameAllowed = !allowed && state.allowed;
      allowed = state.allowed;
      runtimeState = state;

      // Howler volume and global muting are updated before any deferred voice
      // starts. Existing managed voices keep the same playback ID while blocked;
      // visibility policy may suspend their shared audio context, but Replayable
      // never stops and recreates them during an allowed-state transition.
      lifecycle.update(state, muted);

      if (becameAllowed) {
        // Start any pending voices; active voices ignore repeated start attempts.
        for (const playback of managedPlaybacks) {
          playback.start();
        }
      }
    },

    unlock(): void {
      lifecycle.unlock();
    },
  };

  /** Tracks a pending request until the sound loader resolves this asset ID. */
  function retainUnresolvedPlayback(id: string, playback: ManagedAudioPlayback): void {
    const playbacks = unresolvedPlaybacks.get(id) ?? new Set();

    playbacks.add(playback);
    unresolvedPlaybacks.set(id, playbacks);
  }

  /** Binds every pending playback for this sound ID to its loaded `Howl`. */
  function resolveSound(id: string, sound: Howl): void {
    const playbacks = unresolvedPlaybacks.get(id);

    if (playbacks === undefined) {
      return;
    }

    // Remove the index entry before notifying playbacks; a callback can clean up
    // the same playback while handling its own completion.
    unresolvedPlaybacks.delete(id);

    for (const playback of playbacks) {
      playback.setSound(sound);
      startIfAllowed(playback);
    }
  }

  /** Starts a managed handle only when permission is already allowed. */
  function startIfAllowed(playback: ManagedAudioPlayback): void {
    if (allowed) {
      playback.start();
    }
  }

  /** Removes the handle from both registries; pending index only if still unresolved. */
  function removeManagedPlayback(id: string, playback: ManagedAudioPlayback): void {
    managedPlaybacks.delete(playback);

    const playbacks = unresolvedPlaybacks.get(id);

    if (playbacks === undefined) {
      return;
    }

    playbacks.delete(playback);

    if (playbacks.size === 0) {
      unresolvedPlaybacks.delete(id);
    }
  }
}
