import { createLayout, createSprite } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';
import { Container } from 'pixi.js';

import { sprites } from '../../assets/registries';
import type { BackgroundTransition, SceneBackground } from '../../types/background';
import { createBackgroundLayoutConfig } from './configs/background-layout';
import { createBackgroundDissolve } from './create-background-dissolve';

/** Composes two fullscreen backgrounds and delegates their transition to the dissolve effect. */
export function createBackground(): SceneBackground {
  const container = new Container({ label: 'background', eventMode: 'none' });

  const layout = createLayout(createBackgroundLayoutConfig());

  const gameplay = createSprite({ texture: sprites['play/bg'], eventMode: 'none' });
  const endcard = createSprite({ texture: sprites['cta/bg'], eventMode: 'none' });

  const dissolve = createBackgroundDissolve(gameplay);

  // Both sprites cover the same area; gameplay renders last, above the endcard.
  layout.attach('background', endcard);
  layout.attach('background', gameplay);
  container.addChild(layout.container);
  endcard.visible = false;

  const removeResizeListener = playable.on('resize', resize);

  return { container, transitionToEndCard, destroy };

  /** Reveal the incoming artwork underneath the outgoing sprite's dissolve. */
  function transitionToEndCard(): BackgroundTransition {
    if (!container.destroyed) {
      endcard.visible = true;
    }
    return dissolve.start();
  }

  /** One layout refits both sprites; the effect keeps its filter output fullscreen. */
  function resize(): void {
    layout.update(createBackgroundLayoutConfig());
  }

  /** Cancel the effect before destroying its sprite; shared textures remain loaded. */
  function destroy(): void {
    removeResizeListener();
    dissolve.destroy();
    gameplay.destroy();
    endcard.destroy();
    layout.destroy();
    container.destroy();
  }
}
