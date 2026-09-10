import type { PuzzleLevel } from '../../types/puzzle';

/**
 * The first Word Garden puzzle.
 *
 * The explicit coordinates form this five-by-five crossword:
 *
 * ```text
 * · · L · ·
 * B L O O M
 * O · O · ·
 * O · M · ·
 * M · · · ·
 * ```
 *
 * The wheel contains two independently selectable `O` tokens because several
 * answers use the same letter twice.
 */
export const wordGardenLevel = {
  columns: 5,
  rows: 5,
  letters: [
    { id: 'b', value: 'B' },
    { id: 'l', value: 'L' },
    { id: 'o-1', value: 'O' },
    { id: 'o-2', value: 'O' },
    { id: 'm', value: 'M' },
  ],
  words: [
    {
      answer: 'BLOOM',
      cells: [
        { column: 0, row: 1 },
        { column: 1, row: 1 },
        { column: 2, row: 1 },
        { column: 3, row: 1 },
        { column: 4, row: 1 },
      ],
    },
    {
      answer: 'BOOM',
      cells: [
        { column: 0, row: 1 },
        { column: 0, row: 2 },
        { column: 0, row: 3 },
        { column: 0, row: 4 },
      ],
    },
    {
      answer: 'LOOM',
      cells: [
        { column: 2, row: 0 },
        { column: 2, row: 1 },
        { column: 2, row: 2 },
        { column: 2, row: 3 },
      ],
    },
  ],
} as const satisfies PuzzleLevel;
