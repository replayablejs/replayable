import type { RuntimeAudioState } from '#types/audio.js';

/**
 * Derives whether audio may currently be audible from project and host facts.
 *
 * Audio is allowed only after the project includes audio, the user has
 * interacted, the host considers the ad visible, and host volume is non-zero.
 * The volume remains available even while audio is blocked so a later state
 * transition can restore the host's current value without another update.
 */
export function resolveAudioState(
  enabled: boolean,
  interacted: boolean,
  visible: boolean,
  volume: number,
): RuntimeAudioState {
  return {
    allowed: enabled && interacted && visible && volume > 0,
    volume,
  };
}

/** Compares the complete public audio state before emitting `audiochange`. */
export function hasEqualAudioState(left: RuntimeAudioState, right: RuntimeAudioState): boolean {
  return left.allowed === right.allowed && left.volume === right.volume;
}
