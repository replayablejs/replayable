/** One fixed cell in the crossword grid. Coordinates are zero-based. */
export interface PuzzleCell {
  readonly column: number;
  readonly row: number;
}

/** One selectable wheel letter. The ID distinguishes repeated letter values. */
export interface PuzzleLetter {
  readonly id: string;
  readonly value: string;
}

/** One accepted answer and the ordered grid cells that reveal its letters. */
export interface PuzzleWord {
  readonly answer: string;
  readonly cells: readonly PuzzleCell[];
}

/** Complete immutable content required to play and render one puzzle. */
export interface PuzzleLevel {
  readonly columns: number;
  readonly rows: number;
  readonly letters: readonly PuzzleLetter[];
  readonly words: readonly PuzzleWord[];
}

/** Result of submitting one completed letter-wheel gesture. */
export type PuzzleSubmission =
  | {
      readonly status: 'accepted';
      readonly word: PuzzleWord;
      readonly completedWords: number;
      readonly complete: boolean;
    }
  | {
      readonly status: 'already-found';
      readonly word: PuzzleWord;
      readonly completedWords: number;
    }
  | {
      readonly status: 'invalid';
      readonly selection: string;
      readonly completedWords: number;
    };

/** Stateful puzzle rules with no knowledge of DOM, animation, or Replayable. */
export interface PuzzleSession {
  /** Reports whether one authored answer has already been accepted. */
  isSolved(answer: string): boolean;
  submit(selection: string): PuzzleSubmission;
}
