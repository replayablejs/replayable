import { createLayout } from '@replayablejs/pixi';

import type { Board, BoardCallbacks, BoardCard } from '../../types/board';
import type { Card } from '../../types/card';
import { createCard } from '../card/create-card';
import { createBoardLayoutConfig } from './configs/board-layout';
import { createBoardTransitions } from './create-board-transitions';

/** Composes card slots and reports progress; cards own their individual animations. */
export function createBoard(callbacks: BoardCallbacks): Board {
  const config = createBoardLayoutConfig();
  const layout = createLayout(config);
  const slots = Object.keys(config.areas);
  let active = true;

  const cards = slots.map(createBoardCard);
  const transitions = createBoardTransitions(cards);
  layout.container.label = 'board';

  return { container: layout.container, show, getUnopenedCards, resize, stop, hide, destroy };

  /** Creates and attaches each card without starting its entrance. */
  function createBoardCard(area: string): Card {
    const card = createCard({
      onRevealStarted: handleCardRevealStarted,
      onRevealCompleted: handleCardRevealCompleted,
    });
    layout.attach(area, card.container);
    return card;
  }

  /** Scene composition is finished; the coordinator can now start card entrances. */
  function show(): void {
    if (active) {
      transitions.show(handleEntranceComplete);
    }
  }

  /** Flipping cards are already accepted, so hints must not target them again. */
  function getUnopenedCards(): readonly BoardCard[] {
    return active ? cards.filter((card) => card.state === 'back') : [];
  }

  /** Repositions existing cards without changing their reveal state or animation. */
  function resize(): void {
    layout.update(createBoardLayoutConfig());
  }

  /** Observe actual animation completion, not a second copy of entrance durations. */
  function handleEntranceComplete(): void {
    if (active) {
      callbacks.onEntranceComplete();
    }
  }

  /** Forward accepted reveals only while active; suppress late or re-entrant notifications. */
  function handleCardRevealStarted(): void {
    if (active) {
      callbacks.onCardRevealStarted();
    }
  }

  /** Wait for every front animation, then close reporting before notifying the scene. */
  function handleCardRevealCompleted(): void {
    if (!active || cards.some((card) => card.state !== 'revealed')) {
      return;
    }

    // Close first: the callback may synchronously complete or destroy the scene.
    // Re-entry and late animation callbacks must never report success twice.
    stop();
    callbacks.onAllCardsRevealed();
  }

  /** Disable input and success reporting once; ongoing reveal animations may finish. */
  function stop(): void {
    if (!active) {
      return;
    }
    active = false;
    for (const card of cards) {
      card.stopInput();
    }
  }

  /** Stop interaction before starting the shared reverse-staggered exit wait. */
  function hide(): Promise<void> {
    stop();
    return transitions.hide();
  }

  /** Cancel the exit wait, release cards, then release placement bookkeeping. */
  function destroy(): void {
    transitions.destroy();
    stop();
    for (const card of cards) {
      card.destroy();
    }
    layout.destroy();
  }
}
