import { playable } from '@replayablejs/runtime';

import type { GameAudio } from '../../types/audio';
import type { BoardCallbacks } from '../../types/board';
import type { Tutorial } from '../../types/tutorial';

/** Connects board events to gameplay guidance, sound, and runtime completion. */
export function createBoardCallbacks(
  audio: GameAudio,
  tutorial: Tutorial | undefined,
): BoardCallbacks {
  return {
    /** Show guidance after the last card enters, not after an estimated delay. */
    onEntranceComplete(): void {
      tutorial?.show();
    },

    /** Only an accepted card reveal produces sound, not a hint or background tap. */
    onCardRevealStarted(): void {
      audio.playCardReveal();
    },

    /** The board reports revealed cards; gameplay interprets that outcome as success. */
    onAllCardsRevealed(): void {
      playable.complete('success');
    },
  };
}
