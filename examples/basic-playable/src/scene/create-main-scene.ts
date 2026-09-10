import { playable, type PlayableCompletion } from '@replayablejs/runtime';

import type { MainScene } from '../types/main-scene';
import { applyBackgroundArtwork } from './background/apply-background-artwork';
import { createEndCard } from './endcard/create-end-card';
import { createGameplay } from './gameplay/create-gameplay';
import { createInterface } from './interface/create-interface';
import { synchronizeSceneScreen } from './synchronize-scene-screen';

import './main-scene.css';

const SUCCESS_END_CARD_DELAY_SECONDS = 1;

/** Composes the DOM scene; features own behavior, CSS owns their responsive placement. */
export function createMainScene(): MainScene {
  const container = document.createElement('main');
  container.className = 'word-garden';
  applyBackgroundArtwork(container);

  const gameplay = createGameplay(container);
  const endCard = createEndCard();
  const ui = createInterface();
  container.append(ui.header, gameplay.container, ui.persistentCta, endCard.container);

  const removeScreenListener = synchronizeSceneScreen(container);
  const removeCompletionListener = playable.on('complete', handleCompletion);
  let destroyed = false;

  return { container, show, destroy };

  /** Start entrances after mounting, so Motion can measure the rendered elements. */
  function show(): void {
    ui.show();
    gameplay.show();
  }

  /** Stop interaction now, keeping the final answer visible before a successful endcard. */
  function handleCompletion(completion: PlayableCompletion): void {
    gameplay.stop();
    void transitionToEndCard(completion);
  }

  /** Runtime's visible-time delay pauses with the playable; it is not a browser timeout. */
  async function transitionToEndCard({ reason }: PlayableCompletion): Promise<void> {
    if (reason === 'success') {
      await playable.timers.delay(SUCCESS_END_CARD_DELAY_SECONDS);
    }
    // A destroyed scene must not be revealed when its pending delay eventually finishes.
    if (destroyed) {
      return;
    }

    ui.showEndCard();
    endCard.show(reason === 'success' ? 'success' : 'timeout');
  }

  /** Explicit teardown for a future scene replacement, not a pagehide workaround. */
  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;
    removeCompletionListener();
    removeScreenListener();
    gameplay.destroy();
    endCard.destroy();
    ui.destroy();
    container.remove();
  }
}
