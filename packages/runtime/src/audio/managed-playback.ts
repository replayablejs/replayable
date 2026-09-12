import type { Howl, HowlCallback } from '#audio/howler.js';
import { resolveAudioStopOptions, resolveAudioVolume } from '#audio/resolve-options.js';
import type {
  PlaybackStatus,
  ActiveVoice,
  AudioPlaybackOptions,
  AudioStopOptions,
  ManagedAudioPlayback,
} from '#types/audio.js';

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Creates one managed Howler voice that may wait for both its sound and unlock.
 *
 * A playback exists as a single object and moves through this lifecycle:
 *
 * 1. It starts pending, without requiring a loaded sound or allocating a voice.
 * 2. `setSound()` stores the loaded `Howl`; playback is still pending.
 * 3. `start()` allocates one voice and records its ID.
 * 4. A non-looping voice finishes through Howler's `end` event, while a loop
 *    remains active until the application calls `stop()`.
 * 5. Stopping (immediate or faded) removes listeners, stops the exact voice,
 *    and calls `onFinished` so the orchestrator can forget the handle.
 *
 * ```ts
 * const playback = createManagedPlayback({
 *   fadeIn: 0.5,
 *   loop: true,
 *   volume: 0.6,
 * }, removePlayback);
 *
 * playback.setSound(sound);
 * playback.start();
 * playback.stop({ fadeOut: 0.4 });
 * ```
 *
 * Calling `stop()` before `start()` simply finishes the pending handle: no voice
 * is created and later load/unlock events will not restart it. Howler operations
 * are routed by this handle's playback ID so shared source `Howl`s do not mix
 * control.
 *
 * `start` is invoked by the audio controller when loading or permission opens a gate.
 * Public controls and metadata remain available on the same handle after finishing.
 */
export function createManagedPlayback(
  options: Required<AudioPlaybackOptions>,
  onFinished: (playback: ManagedAudioPlayback) => void,
): ManagedAudioPlayback {
  let activeVoice: ActiveVoice | undefined;
  let endListener: HowlCallback | undefined;
  let sound: Howl | undefined;
  let status: PlaybackStatus = 'pending';
  let volume = options.volume;
  let soundDuration = 0;

  const playback: ManagedAudioPlayback = {
    get position(): number {
      if (activeVoice === undefined) {
        return 0;
      }

      const position = activeVoice.sound.seek(activeVoice.id);
      return options.loop && soundDuration > 0 ? position % soundDuration : position;
    },

    get duration(): number {
      return soundDuration;
    },

    setVolume(nextVolume): void {
      resolveAudioVolume(nextVolume);
      if (status === 'stopping' || status === 'finished') {
        return;
      }

      volume = nextVolume;
      if (activeVoice !== undefined) {
        const { sound: activeSound, id } = activeVoice;
        activeSound.volume(volume, id);
        // Howler cancels fades by restoring their target, including its stored
        // volume. Reapply our value after cancellation so later fades/mutes use it.
        activeSound.volume(volume, id);
      }
    },

    setSound(loadedSound): void {
      if (status !== 'pending' || sound !== undefined) {
        return;
      }

      sound = loadedSound;
      soundDuration = loadedSound.duration();
    },

    start(): void {
      if (status !== 'pending' || sound === undefined) {
        return;
      }

      // Howler returns a new ID for this voice even when another handle is
      // already playing the same source sound.
      const playbackId = sound.play();

      activeVoice = { id: playbackId, sound };
      status = 'playing';

      const fadeInMilliseconds = options.fadeIn * MILLISECONDS_PER_SECOND;
      const shouldFadeIn = fadeInMilliseconds > 0 && volume > 0;

      // Volume and looping are scoped to this ID rather than the shared Howl.
      sound.volume(shouldFadeIn ? 0 : volume, playbackId);
      sound.loop(options.loop, playbackId);

      if (shouldFadeIn) {
        sound.fade(0, volume, fadeInMilliseconds, playbackId);
      }

      if (!options.loop) {
        listenForEnd();
      }
    },

    stop(stopOptions?: AudioStopOptions): void {
      if (status === 'stopping' || status === 'finished') {
        return;
      }

      const { fadeOut } = resolveAudioStopOptions(stopOptions);

      if (activeVoice === undefined || fadeOut === 0) {
        finish();

        return;
      }

      // The handle rejects repeated commands while the underlying voice remains
      // audible until its fade completes.
      status = 'stopping';
      removeEndListener();
      fadeOutPlayback(fadeOut);
    },
  };

  return playback;

  /** Stops this voice after fading from its current volume to silence. */
  function fadeOutPlayback(duration: number): void {
    if (activeVoice === undefined) {
      return;
    }

    const { id, sound: activeSound } = activeVoice;
    const currentVolume = activeSound.volume(id);

    if (typeof currentVolume !== 'number') {
      throw new Error(`Unable to read volume for Howler playback ${id}.`);
    }

    if (currentVolume === 0) {
      finish();

      return;
    }

    const handleFade = (fadedPlaybackId: number): void => {
      if (fadedPlaybackId !== activeVoice?.id) {
        return;
      }

      finish();
    };

    // Starting the new fade first replaces an in-progress fade-in. Howler emits
    // `fade` when cancelling that old transition, so Replayable subscribes only
    // after the replacement begins and waits for the fade-out itself.
    activeSound.fade(currentVolume, 0, duration * MILLISECONDS_PER_SECOND, id);
    activeSound.once('fade', handleFade, id);
  }

  /**
   * Retires this handle and releases its pending or active Howler voice.
   *
   * `onFinished` removes the handle from the orchestrator's retained set. It is
   * called for pending cancellation, natural completion, and explicit stopping.
   */
  function finish(): void {
    status = 'finished';
    stopActivePlayback();
    onFinished(playback);
  }

  /** Lets a finite, non-looping sound release itself after natural completion. */
  function listenForEnd(): void {
    if (activeVoice === undefined) {
      return;
    }

    const { id, sound: activeSound } = activeVoice;
    const handleEnd = (endedPlaybackId: number): void => {
      if (endedPlaybackId !== activeVoice?.id) {
        return;
      }

      endListener = undefined;
      finish();
    };

    endListener = handleEnd;
    activeSound.once('end', handleEnd, id);
  }

  /**
   * Stops the active voice and releases Replayable's Howler listeners.
   *
   * Howler emits `stop`, not `end`, for this operation. The `end` listener is
   * removed because its ID-scoped callback is no longer useful and would
   * otherwise remain retained by the shared `Howl`.
   */
  function stopActivePlayback(): void {
    if (activeVoice === undefined) {
      return;
    }

    const { id, sound: activeSound } = activeVoice;

    removeEndListener();
    activeVoice = undefined;
    activeSound.stop(id);
  }

  function removeEndListener(): void {
    if (endListener === undefined || activeVoice === undefined) {
      return;
    }

    activeVoice.sound.off('end', endListener, activeVoice.id);
    endListener = undefined;
  }
}
