import { createSprite } from '@replayablejs/pixi';
import { Container } from 'pixi.js';

import { atlases } from '../../assets/registries';
import type { BoardCard } from '../../types/board';
import type { HintHand } from '../../types/hint';
import { animateHintSequence } from './animate-hint-sequence';

/** Owns hand presentation and cancellation, without timers or gameplay progress. */
export function createHintHand(): HintHand {
  const container = new Container({ label: 'hint', eventMode: 'none', visible: false });
  const sprite = createSprite({ texture: atlases.ui.hand, anchor: { x: 0.05, y: 0.05 } });
  container.addChild(sprite);
  let stopSequence: (() => void) | undefined;

  return {
    container,
    get visible(): boolean {
      return container.visible;
    },
    show,
    cancel,
    destroy,
  };

  /** Each demonstration starts a fresh route through the supplied unopened cards. */
  function show(cards: readonly BoardCard[], onComplete: () => void): void {
    if (container.parent === null || cards.length === 0) {
      return;
    }
    cancel();
    stopSequence = animateHintSequence(container, sprite, cards, finish);

    /** Retire presentation before allowing the lifecycle to schedule another hint. */
    function finish(): void {
      stopSequence = undefined;
      container.visible = false;
      onComplete();
    }
  }

  /** Stop without reporting completion; reset the sprite for the next fresh route. */
  function cancel(): void {
    stopSequence?.();
    stopSequence = undefined;
    sprite.scale.set(1);
    sprite.position.set(0);
    sprite.alpha = 1;
    container.visible = false;
  }

  /** Stop animation before destroying its targets; shared atlas textures stay alive. */
  function destroy(): void {
    cancel();
    container.destroy({ children: true });
  }
}
