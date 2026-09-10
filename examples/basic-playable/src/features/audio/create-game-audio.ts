import type { AudioPlayback, PlayableAudio } from '@replayablejs/runtime';

import { sounds } from '../../assets/registries/index.js';
import type { WordGardenAudio } from '../../types/audio';

const MUSIC_ID = sounds['music-swinging-sweet'];
const MUSIC_VOLUME = 0.28;

/**
 * Maps Word Garden's semantic cues to Replayable's lifecycle-aware audio API.
 *
 * Replayable retains managed music until its secondary sound loads and drops
 * unavailable one-shot effects, so this application facade needs no asset-load
 * state or substitute implementation of its own.
 */
export function createGameAudio(audio: PlayableAudio): WordGardenAudio {
  let music: AudioPlayback | undefined;

  return {
    playAcceptedWord(): void {
      audio.playOneShot(sounds['accepted-word'], { volume: 0.7 });
    },

    playCompletedPuzzle(): void {
      audio.playOneShot(sounds['completed-puzzle'], { volume: 0.7 });
    },

    playHintLetter(): void {
      audio.playOneShot(sounds['hint-letter'], { volume: 0.15 });
    },

    playLetterVisit(): void {
      audio.playOneShot(sounds['letter-visit'], { volume: 0.2 });
    },

    playRejectedWord(): void {
      audio.playOneShot(sounds['rejected-word'], { volume: 0.5 });
    },

    startMusic(): void {
      music ??= audio.play(MUSIC_ID, {
        fadeIn: 0.8,
        loop: true,
        volume: MUSIC_VOLUME,
      });
    },

    stopMusic(): void {
      music?.stop({ fadeOut: 0.4 });
      music = undefined;
    },
  };
}
