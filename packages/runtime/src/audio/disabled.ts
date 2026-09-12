import { resolveAudioVolume } from '#audio/resolve-options.js';
import type { AudioController, AudioPlayback } from '#types/audio.js';

/**
 * Stable handle returned for every disabled managed-playback request.
 *
 * Shared application code may retain this handle and call `stop()` without
 * checking whether the current variant includes audio. It is safe to reuse
 * because the handle contains no playback ID or mutable state.
 */
const disabledPlayback: AudioPlayback = {
  position: 0,
  duration: 0,
  setVolume(volume): void {
    resolveAudioVolume(volume);
  },
  stop(): void {},
};

/**
 * Complete no-op audio controller selected for an audio-disabled variant.
 *
 * This module deliberately imports no Howler implementation and registers no
 * sound loader. Consequently, disabled builds require neither sound resources
 * nor audio lifecycle work while exposing exactly the same application API.
 * Transient effects, host updates, visibility changes, and unlock attempts are
 * all intentionally ignored.
 */
const disabledAudio: AudioController = {
  get muted(): boolean {
    return true;
  },
  setMuted(): void {},
  play(): AudioPlayback {
    return disabledPlayback;
  },
  playOneShot(): void {},
  setVisible(): void {},
  update(): void {},
  unlock(): void {},
};

/**
 * Returns the no-op facade used by variants whose audio capability is disabled.
 *
 * Reusing this singleton is safe because both the controller and its returned
 * playback handle are stateless.
 */
export function createAudio(): AudioController {
  return disabledAudio;
}
