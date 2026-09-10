import type { PuzzleCell } from './puzzle';
export interface BoardCellDefinition extends PuzzleCell {
  readonly answers: string[];
  readonly letter: string;
}
export type RejectionClass = 'is-already-found' | 'is-invalid';
