import { playable } from '@replayablejs/runtime';

import { createGameAudio } from '../../features/audio/create-game-audio';
import { createBoard } from '../../features/board/create-board';
import { createBoardGame } from '../../features/board/create-board-game';
import { wordGardenLevel } from '../../features/board/level';
import { createHint } from '../../features/hint/create-hint';
import { installHintInteraction } from '../../features/hint/install-hint-interaction';
import { createLetterWheel } from '../../features/letter-wheel/create-letter-wheel';
import { createTutorial } from '../../features/tutorial/create-tutorial';
import type { Gameplay } from '../../types/gameplay';
import { animateGameplayEntrance } from './animate-gameplay-entrance';

/** Composes the puzzle, gesture input, guidance, and sound for one word-connect game. */
export function createGameplay(root: HTMLElement): Gameplay {
  const { hint: hintEnabled, hintDelay, startMuted } = playable.config.params;
  if (
    typeof hintEnabled !== 'boolean' ||
    typeof hintDelay !== 'number' ||
    typeof startMuted !== 'boolean'
  ) {
    throw new Error('Word Garden requires hint, hintDelay, and startMuted parameters.');
  }

  const container = document.createElement('div');
  container.className = 'play-area';
  const instruction = playable.localization.translate('instruction');
  const board = createBoard(wordGardenLevel, instruction);
  const tutorial = createTutorial();
  const wheel = createLetterWheel(wordGardenLevel, tutorial.element, instruction);
  container.append(board.puzzlePanel, wheel.wheelPanel);

  playable.audio.setMuted(startMuted);
  const audio = createGameAudio(playable.audio);
  const game = createBoardGame({
    audio,
    level: wordGardenLevel,
    board,
    wheel,
    onSelectionComplete: tutorial.handleSelection,
    completePlayable: () => playable.complete('success'),
  });
  const hint = createHint({
    audio,
    delay: hintDelay,
    game,
    level: wordGardenLevel,
    timers: playable.timers,
    view: wheel,
  });
  const removeHintInteraction = installHintInteraction(root, hint);
  let stopEntrance: (() => void) | undefined;

  return { container, show, stop, destroy };

  /** Start presentation only after the scene mounts its panels. */
  function show(): void {
    stopEntrance?.();
    stopEntrance = animateGameplayEntrance(board, wheel);
    if (hintEnabled) {
      hint.start();
    }
    audio.startMusic();
  }

  /** Freeze input immediately; the final solved board remains visible underneath the endcard. */
  function stop(): void {
    game.stop();
    hint.stop();
    audio.stopMusic();
  }

  /** Each owner releases its own input, timer, observer, or animation. */
  function destroy(): void {
    stop();
    stopEntrance?.();
    removeHintInteraction();
    game.destroy();
    board.destroy();
    wheel.destroy();
  }
}
