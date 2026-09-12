import type { Howl } from '#audio/howler.js';

/** Options for one transient sound effect. */
export interface AudioOneShotOptions {
  /** Playback volume from silent (`0`) to full source volume (`1`). */
  readonly volume?: number;
}

/** Options for one managed sound playback. */
export interface AudioPlaybackOptions {
  /** Playback volume from silent (`0`) to full source volume (`1`). */
  readonly volume?: number;
  /** Repeats the sound until its playback handle is stopped. */
  readonly loop?: boolean;
  /** Seconds spent fading from silence to the configured volume. */
  readonly fadeIn?: number;
}

/** Options for stopping managed sound playback. */
export interface AudioStopOptions {
  /** Seconds spent fading from the current volume to silence before stopping. */
  readonly fadeOut?: number;
}

/** Controls one managed playback while pending or active. */
export interface AudioPlayback {
  /** Sets this voice's volume (0..1), without restarting it; cancels fade-in. */
  setVolume(volume: number): void;
  /** Backend position in seconds; zero before start and after finish, wraps for loops. */
  readonly position: number;
  /** Full sound duration in seconds; zero until loaded, retained after finish. */
  readonly duration: number;
  /** Cancels deferred start or stops the active sound. */
  stop(options?: AudioStopOptions): void;
}

/** Internal controls retained while Replayable owns a managed playback. */
export interface ManagedAudioPlayback extends AudioPlayback {
  /** Supplies the loaded Howler sound that will own this playback's voice. */
  setSound(sound: import('howler').Howl): void;
  /** Starts only when a sound is present; otherwise leaves the same handle pending. */
  start(): void;
}

/** Capability-aware sound playback exposed to playable application code. */
export interface PlayableAudio {
  /** Whether application audio is currently muted by the playable itself. */
  readonly muted: boolean;
  /** Changes application mute state without stopping active managed playback. */
  setMuted(muted: boolean): void;
  /**
   * Creates managed playback that starts after loading and audio permission.
   *
   * The returned handle remains valid while deferred, so `stop()` before both
   * conditions are met cancels the pending sound.
   */
  play(id: string, options?: AudioPlaybackOptions): AudioPlayback;
  /**
   * Plays one transient effect immediately, or drops it when unavailable.
   *
   * Dropping blocked or unloaded one-shots prevents stale sounds from replaying
   * after later load/unlock.
   */
  playOneShot(id: string, options?: AudioOneShotOptions): void;
}

/** Effective audio conditions derived from capability and host lifecycle state. */
export interface RuntimeAudioState {
  /** Whether sounds may currently be audible. */
  readonly allowed: boolean;
  /** Host-provided volume normalized from silent (`0`) to full volume (`1`). */
  readonly volume: number;
}

/** Internal audio facade controls retained by the runtime lifecycle. */
export interface AudioController extends PlayableAudio {
  /** Applies a host visibility transition to the underlying audio context. */
  setVisible(visible: boolean): void;
  /** Applies the latest effective host and interaction conditions. */
  update(state: RuntimeAudioState): void;
  /** Unlocks browser audio synchronously inside the first trusted interaction. */
  unlock(): void;
}

export type PlaybackStatus = 'pending' | 'playing' | 'stopping' | 'finished';

export interface ActiveVoice {
  readonly id: number;
  readonly sound: Howl;
}
