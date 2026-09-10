import { playable } from '@replayablejs/runtime';
import { Container } from 'pixi.js';

import type { MainScene } from '../types/main-scene';
import { createBackground } from './background/create-background';
import { createEndCard } from './endcard/create-end-card';
import { createGameplay } from './gameplay/create-gameplay';
import { createInterface } from './interface/create-interface';

/** Composes the four visual layers and connects their game-to-endcard transition. */
export function createMainScene(): MainScene {
  // Receive captured input from every layer, including controls above gameplay.
  const container = new Container({ label: 'main-scene', eventMode: 'static' });
  const background = createBackground();
  const gameplay = createGameplay(container);
  const endCard = createEndCard();
  const ui = createInterface(endCard);

  // Back to front: fullscreen artwork, the game, its result, then persistent UI.
  // Sound remains above the endcard click shield; the logo never disappears.
  container.addChild(background.container, gameplay.container, endCard.container, ui.container);

  let removePostRenderListener: ReturnType<typeof playable.postRender.add> | undefined;
  const removeCompletionListener = playable.on('complete', handleCompletion);

  return { container, destroy };

  /** Stop input now, but let the renderer present the final Spine pose before exiting. */
  function handleCompletion(): void {
    gameplay.stop();
    removePostRenderListener = playable.postRender.add(startEndCardTransition);
  }

  /** Unsubscribe inside the callback so the transition starts after exactly one render. */
  function startEndCardTransition(): void {
    removePostRenderListener?.();
    removePostRenderListener = undefined;
    void transitionToEndCard().catch(reportTransitionError);
  }

  /**
   * Cards exit, the background dissolves, the popup enters, then branding moves.
   * The dissolve continues behind the popup after its midpoint.
   * Destroying any layer rejects its pending wait with AbortError, ending this sequence.
   */
  async function transitionToEndCard(): Promise<void> {
    await gameplay.hide();

    const transition = background.transitionToEndCard();
    await transition.midpoint;

    await endCard.show();

    await ui.moveLogoToEndCard();
  }

  /** Scene destruction is expected cancellation; genuine failures remain visible. */
  function reportTransitionError(error: unknown): void {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return;
    }
    console.error('Failed to transition to the endcard.', error);
  }

  /** Each layer releases its own objects, animations, and listeners. */
  function destroy(): void {
    removeCompletionListener();
    removePostRenderListener?.();
    gameplay.destroy();
    background.destroy();
    endCard.destroy();
    ui.destroy();
    container.destroy({ children: true });
  }
}
