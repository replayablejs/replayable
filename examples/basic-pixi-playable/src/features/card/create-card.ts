import type { AnimationStateListener, TrackEntry } from '@esotericsoftware/spine-pixi-v8';

import { spines } from '../../assets/registries';
import type { Card, CardOptions, CardState } from '../../types/card';
import { createCardTransitions } from './create-card-transitions';
import { createCardView } from './create-card-view';

/** Owns input and reveal state; view construction and decorative transitions stay separate. */
export function createCard(options: CardOptions = {}): Card {
  const view = createCardView();
  const transitions = createCardTransitions(view);
  const { container, spine } = view;
  const animations = spines.card.animations;
  const listener: AnimationStateListener = { complete: handleAnimationComplete };
  let state: CardState = 'back';
  let inputStopped = false;

  return {
    container,
    get state(): CardState {
      return state;
    },
    show,
    stopInput,
    hide,
    destroy,
  };

  /** Enable this card only after its complete entrance, including the stagger delay. */
  function show(delay: number, onComplete: () => void): void {
    transitions.show(delay, handleEntranceComplete);

    /** A board stopped during entrance must never regain interactive cards. */
    function handleEntranceComplete(): void {
      if (!inputStopped && state === 'back') {
        container.eventMode = 'static';
        container.cursor = 'pointer';
        // Repeated show calls must not install duplicate tap handlers.
        container.off('pointertap', handleTap);
        container.on('pointertap', handleTap);
      }
      onComplete();
    }
  }

  /** Lock state before notifying application callbacks or starting the reveal. */
  function handleTap(): void {
    if (state !== 'back') {
      return;
    }

    state = 'flipping';
    stopInput();
    spine.state.addListener(listener);
    spine.state.setAnimation(0, animations.rotate, false);
    spine.state.addAnimation(0, animations.card_front, false, 0);
    options.onRevealStarted?.();
  }

  /** The front animation must finish too; completing the flip alone is too early. */
  function handleAnimationComplete(entry: TrackEntry): void {
    if (entry.animation?.name !== animations.card_front) {
      return;
    }

    spine.state.removeListener(listener);
    state = 'revealed';
    options.onRevealCompleted?.();
  }

  /** Disable interaction, then settle entrance without interrupting a Spine reveal. */
  function stopInput(): void {
    inputStopped = true;
    container.off('pointertap', handleTap);
    container.eventMode = 'none';
    container.cursor = 'default';
    transitions.settle();
  }

  /** Input stops before the decorative exit; the outer layout box remains unchanged. */
  function hide(delay: number, onComplete: () => void): void {
    stopInput();
    transitions.hide(delay, onComplete);
  }

  /** Release animation work and Spine listeners before destroying their display objects. */
  function destroy(): void {
    stopInput();
    transitions.destroy();
    spine.state.removeListener(listener);
    container.destroy({ children: true });
  }
}
