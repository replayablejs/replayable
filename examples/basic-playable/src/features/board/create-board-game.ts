import type { WordGardenGame, WordGardenGameOptions } from '../../types/game';
import type { LetterSelection } from '../../types/input';
import type { PuzzleSubmission, PuzzleWord } from '../../types/puzzle';
import { createLetterWheelInput } from '../letter-wheel/create-letter-wheel-input';
import {
  animateAcceptedWord,
  animateProgress,
  animateRejectedWord,
} from './animate-board-feedback';
import { createPuzzleSession } from './create-puzzle-session';

/** Connects pointer selections to pure puzzle rules and their rendered result. */
export function createBoardGame({
  audio,
  completePlayable,
  level,
  onSelectionComplete,
  board,
  wheel,
}: WordGardenGameOptions): WordGardenGame {
  const puzzle = createPuzzleSession(level);
  const input = createLetterWheelInput(wheel, {
    onSelection: handleSelection,
    onVisit: () => audio.playLetterVisit(),
  });

  return {
    isWordSolved(answer): boolean {
      return puzzle.isSolved(answer);
    },

    destroy(): void {
      input.dispose();
    },

    stop(): void {
      input.setEnabled(false);
    },
  };

  /** Applies exactly one puzzle outcome for each completed wheel gesture. */
  function handleSelection(selection: LetterSelection): void {
    onSelectionComplete(selection);

    const { word } = selection;
    const submission = puzzle.submit(word);

    switch (submission.status) {
      case 'accepted':
        if (submission.complete) {
          audio.playCompletedPuzzle();
        } else {
          audio.playAcceptedWord();
        }

        revealWord(submission.word);
        board.progress.value = submission.completedWords;

        if (submission.complete) {
          input.setEnabled(false);
        }

        wheel.currentWord.value = submission.word.answer;

        if (submission.complete) {
          completePlayable();
        }
        break;
      case 'already-found':
        audio.playRejectedWord();
        showRejectedSelection(submission.word.answer, submission.status);
        break;
      case 'invalid':
        audio.playRejectedWord();
        showRejectedSelection(submission.selection, submission.status);
        break;
    }
  }

  /** Reveals every rendered cell occupied by one accepted answer. */
  function revealWord(word: PuzzleWord): void {
    const cells = board.cellsByWord.get(word.answer);

    if (cells === undefined) {
      throw new Error(`Rendered cells for ${word.answer} were not found.`);
    }

    const newlyRevealedCells = cells.filter((cell) => !cell.classList.contains('is-revealed'));

    for (const cell of newlyRevealedCells) {
      cell.classList.add('is-revealed');
    }

    animateAcceptedWord(newlyRevealedCells);
    animateProgress(board.progress);
  }

  /** Shows short visual feedback without changing puzzle progress. */
  function showRejectedSelection(
    selection: string,
    status: Exclude<PuzzleSubmission['status'], 'accepted'>,
  ): void {
    const feedbackClass = status === 'invalid' ? 'is-invalid' : 'is-already-found';

    wheel.currentWord.value = selection;
    animateRejectedWord(wheel.currentWord, feedbackClass);
  }
}
