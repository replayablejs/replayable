import type { WordGardenAudio } from './audio';
import type { LetterSelection } from './input';
import type { PuzzleLevel } from './puzzle';
import type { BoardView, WheelView } from './view';

/** Gameplay controls shared with the surrounding Replayable lifecycle. */
export interface WordGardenGame {
  /** Reports puzzle progress without exposing the mutable session itself. */
  isWordSolved(answer: string): boolean;
  stop(): void;
  destroy(): void;
}

export interface WordGardenGameOptions {
  readonly audio: WordGardenAudio;
  readonly completePlayable: () => void;
  readonly level: PuzzleLevel;
  readonly onSelectionComplete: (selection: LetterSelection) => void;
  readonly board: BoardView;
  readonly wheel: WheelView;
}
