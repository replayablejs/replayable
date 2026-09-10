import { playable } from '@replayablejs/runtime';
import { Container, Rectangle } from 'pixi.js';

import { createGameAudio } from '../../features/audio/create-game-audio';
import { createBoard } from '../../features/board/create-board';
import { createHint } from '../../features/hint/create-hint';
import { createTutorial } from '../../features/tutorial/create-tutorial';
import type { SceneGameplay } from '../../types/gameplay';
import { createBoardCallbacks } from './create-board-callbacks';
import { createGameplayPlacement } from './create-gameplay-placement';

/** Owns the playable board, tutorial, hint, and gameplay audio. */
export function createGameplay(inputRoot: Container): SceneGameplay {
  const container = new Container({
    label: 'gameplay',
    eventMode: 'static',
    hitArea: new Rectangle(0, 0, playable.screen.frame.width, playable.screen.frame.height),
  });
  const audio = createGameAudio();
  const tutorial = createTutorial();
  const board = createBoard(createBoardCallbacks(audio, tutorial));
  const hint = createHint(board, inputRoot);
  const placement = createGameplayPlacement({ board, tutorial });

  container.addChild(placement.container);

  if (hint !== undefined) {
    container.addChild(hint.container);
  }

  const removeResizeListener = playable.on('resize', resize);
  container.on('pointertap', handleGameplayTap);

  // All card views, layout, and guidance now exist. Creation itself plays no entrance.
  board.show();

  return { container, stop, hide, destroy };

  /** Controls stop propagation; ordinary gameplay taps dismiss the scroll. */
  function handleGameplayTap(): void {
    tutorial?.dismiss();
  }

  /** Stops interaction immediately, while preserving the final card pose for rendering. */
  function stop(): void {
    board.stop();
    hint?.stop();
    tutorial?.dismiss();
    container.off('pointertap', handleGameplayTap);
  }

  /** Reverses card entrances before retiring the entire gameplay layer. */
  async function hide(): Promise<void> {
    container.eventMode = 'none';
    await board.hide();

    // The board may finish just before destruction, while this continuation is queued.
    if (container.destroyed) {
      throw new DOMException('Gameplay was destroyed.', 'AbortError');
    }
    container.visible = false;
  }

  /** Refits existing objects without rebuilding cards, text, or game state. */
  function resize(): void {
    placement.resize();
    container.hitArea = new Rectangle(
      0,
      0,
      playable.screen.frame.width,
      playable.screen.frame.height,
    );
    hint?.resize();
  }

  /** Music survives the endcard transition and stops only when the scene is destroyed. */
  function destroy(): void {
    removeResizeListener();
    container.off('pointertap', handleGameplayTap);
    hint?.destroy();
    tutorial?.destroy();
    board.destroy();
    audio.destroy();
    placement.destroy();
    container.destroy({ children: true });
  }
}
