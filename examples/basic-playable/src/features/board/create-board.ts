import type { BoardCellDefinition } from '../../types/board';
import type { Board } from '../../types/panel';
import type { PuzzleLevel } from '../../types/puzzle';
import { fitStageToPanel } from '../layout/fit-stage-to-panel';

/** Builds the crossword panel once; its session reveals the indexed cells later. */
export function createBoard(level: PuzzleLevel, instruction: string): Board {
  const puzzlePanel = document.createElement('section');
  const puzzleStage = document.createElement('div');
  const progress = document.createElement('progress');
  const board = document.createElement('div');
  puzzlePanel.className = 'puzzle-panel';
  puzzlePanel.ariaLabel = instruction;
  puzzleStage.className = 'puzzle-stage';
  progress.className = 'word-progress';
  progress.ariaLabel = instruction;
  progress.max = level.words.length;
  progress.value = 0;
  board.className = 'puzzle-board';
  board.role = 'grid';
  board.ariaLabel = instruction;
  board.style.setProperty('--board-columns', String(level.columns));
  board.style.setProperty('--board-rows', String(level.rows));
  const cellsByWord = createPuzzleBoard(board, level);
  puzzleStage.append(progress, board);
  puzzlePanel.append(puzzleStage);
  const stopFitting = fitStageToPanel(puzzlePanel, puzzleStage);

  return { puzzlePanel, progress, cellsByWord, destroy: stopFitting };
}

/** Renders each occupied crossword coordinate once and indexes it by answer. */
function createPuzzleBoard(
  board: HTMLElement,
  level: PuzzleLevel,
): ReadonlyMap<string, readonly HTMLElement[]> {
  const definitions = collectBoardCells(level);
  const cellsByWord = new Map<string, HTMLElement[]>();

  for (const definition of definitions) {
    const cell = document.createElement('span');

    cell.className = 'puzzle-cell';
    cell.role = 'gridcell';
    cell.ariaHidden = 'true';
    cell.textContent = definition.letter;
    cell.style.gridColumn = String(definition.column + 1);
    cell.style.gridRow = String(definition.row + 1);
    board.append(cell);

    for (const answer of definition.answers) {
      const wordCells = cellsByWord.get(answer) ?? [];

      wordCells.push(cell);
      cellsByWord.set(answer, wordCells);
    }
  }

  return cellsByWord;
}

/** Collects shared crossword intersections before any DOM nodes are created. */
function collectBoardCells(level: PuzzleLevel): readonly BoardCellDefinition[] {
  const definitionsByPosition = new Map<string, BoardCellDefinition>();

  for (const word of level.words) {
    for (const [index, cell] of word.cells.entries()) {
      const key = `${cell.row}:${cell.column}`;
      const definition = definitionsByPosition.get(key);

      if (definition === undefined) {
        definitionsByPosition.set(key, {
          ...cell,
          answers: [word.answer],
          letter: word.answer.charAt(index),
        });
      } else {
        definition.answers.push(word.answer);
      }
    }
  }

  return [...definitionsByPosition.values()].sort(
    (left, right) => left.row - right.row || left.column - right.column,
  );
}
