import type { PuzzleLevel, PuzzleSession, PuzzleSubmission } from '../../types/puzzle';

/** Creates the word-validation state for one immutable level definition. */
export function createPuzzleSession(level: PuzzleLevel): PuzzleSession {
  const wordsByAnswer = new Map(level.words.map((word) => [word.answer, word]));
  const completedAnswers = new Set<string>();

  return {
    isSolved(answer): boolean {
      return completedAnswers.has(answer);
    },

    submit(selection): PuzzleSubmission {
      const word = wordsByAnswer.get(selection);

      if (word === undefined) {
        return {
          status: 'invalid',
          selection,
          completedWords: completedAnswers.size,
        };
      }

      if (completedAnswers.has(word.answer)) {
        return {
          status: 'already-found',
          word,
          completedWords: completedAnswers.size,
        };
      }

      completedAnswers.add(word.answer);

      return {
        status: 'accepted',
        word,
        completedWords: completedAnswers.size,
        complete: completedAnswers.size === level.words.length,
      };
    },
  };
}
