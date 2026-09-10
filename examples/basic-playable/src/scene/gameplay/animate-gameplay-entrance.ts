import { animate, stagger } from '@replayablejs/tween';

import type { Board, LetterWheel } from '../../types/panel';
/** Introduces panels and letters without changing their fitted layout or input availability. */
export function animateGameplayEntrance(board: Board, wheel: LetterWheel): () => void {
  const panels = animate(
    [board.puzzlePanel, wheel.wheelPanel],
    { opacity: [0, 1], scale: [0.96, 1], y: [18, 0] },
    { delay: stagger(0.1, { startDelay: 0.08 }), duration: 0.4 },
  );
  const letters = animate(
    [...wheel.letterButtons.values()],
    { opacity: [0, 1], scale: [0.65, 1] },
    { delay: stagger(0.04, { startDelay: 0.22 }), duration: 0.28 },
  );
  return () => {
    panels.cancel();
    letters.cancel();
  };
}
