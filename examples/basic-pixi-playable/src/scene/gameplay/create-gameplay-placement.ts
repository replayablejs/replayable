import { createLayout } from '@replayablejs/pixi';

import type { GameplayPlacement, GameplayPlacementOptions } from '../../types/gameplay';
import { createGameplayLayoutConfig } from './configs/gameplay-layout';

/** Owns safe-area placement, not the features or their gameplay behavior. */
export function createGameplayPlacement({
  board,
  tutorial,
}: GameplayPlacementOptions): GameplayPlacement {
  const layoutFeatures = {
    tutorial: tutorial !== undefined,
  };
  const layout = createLayout(createGameplayLayoutConfig(layoutFeatures));

  // The board already initializes its own orientation before it reaches this layout.
  layout.attach('board', board.container);

  if (tutorial !== undefined) {
    layout.attach('tutorial', tutorial.container);
  }

  return { container: layout.container, resize, destroy };

  /** Update the board orientation, then apply the outer layout once. */
  function resize(): void {
    board.resize();
    layout.update(createGameplayLayoutConfig(layoutFeatures));
  }

  /** Releases placement bookkeeping; gameplay owns the feature objects. */
  function destroy(): void {
    layout.destroy();
  }
}
