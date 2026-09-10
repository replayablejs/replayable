import type { AudioOneShotOptions, AudioPlaybackOptions, AudioStopOptions } from '#types/audio.js';

const DEFAULT_FADE_DURATION = 0;
const DEFAULT_VOLUME = 1;

/**
 * Produces the complete options used to create one managed playback.
 *
 * Defaults are applied once at the public API boundary so the playback state
 * machine never needs to distinguish omitted values from explicit values:
 *
 * ```ts
 * resolveAudioPlaybackOptions();
 * // { volume: 1, loop: false, fadeIn: 0 }
 *
 * resolveAudioPlaybackOptions({ loop: true, volume: 0.5 });
 * // { volume: 0.5, loop: true, fadeIn: 0 }
 * ```
 *
 * Invalid numeric values throw before a Howler voice is created.
 */
export function resolveAudioPlaybackOptions(
  options: AudioPlaybackOptions = {},
): Required<AudioPlaybackOptions> {
  return {
    volume: resolveVolume(options.volume),
    loop: options.loop ?? false,
    fadeIn: resolveFadeDuration('fade-in', options.fadeIn),
  };
}

/**
 * Produces the complete options used by one transient sound effect.
 *
 * ```ts
 * resolveAudioOneShotOptions();
 * // { volume: 1 }
 *
 * resolveAudioOneShotOptions({ volume: 0.8 });
 * // { volume: 0.8 }
 * ```
 */
export function resolveAudioOneShotOptions(
  options: AudioOneShotOptions = {},
): Required<AudioOneShotOptions> {
  return {
    volume: resolveVolume(options.volume),
  };
}

/**
 * Produces the complete options used to stop managed playback.
 *
 * ```ts
 * resolveAudioStopOptions();
 * // { fadeOut: 0 }
 *
 * resolveAudioStopOptions({ fadeOut: 0.4 });
 * // { fadeOut: 0.4 }
 * ```
 *
 * A zero duration stops immediately; a positive duration is converted to
 * milliseconds only when the managed playback calls Howler.
 */
export function resolveAudioStopOptions(
  options: AudioStopOptions = {},
): Required<AudioStopOptions> {
  return {
    fadeOut: resolveFadeDuration('fade-out', options.fadeOut),
  };
}

/**
 * Resolves public volume onto Howler's normalized linear gain range.
 *
 * `Number.isFinite` deliberately rejects `NaN` and both infinities in addition
 * to values outside the inclusive `0..1` range.
 */
function resolveVolume(volume = DEFAULT_VOLUME): number {
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) {
    throw new RangeError(
      `Audio volume must be a finite number from 0 through 1; received ${String(volume)}.`,
    );
  }

  return volume;
}

/**
 * Resolves one public fade duration expressed in Replayable-standard seconds.
 *
 * Keeping seconds in the public API matches Replayable's update and fixed-update
 * timing contracts. Only the Howler integration converts this value to
 * milliseconds. `Number.isFinite` also prevents `NaN` and infinity from
 * reaching browser timers.
 */
function resolveFadeDuration(
  name: 'fade-in' | 'fade-out',
  duration = DEFAULT_FADE_DURATION,
): number {
  if (!Number.isFinite(duration) || duration < 0) {
    throw new RangeError(
      `Audio ${name} duration must be a finite, non-negative number of seconds; received ${String(duration)}.`,
    );
  }

  return duration;
}
