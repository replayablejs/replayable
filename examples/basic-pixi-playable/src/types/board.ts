import type { Container } from 'pixi.js';

import type { Card } from './card';

/** Hints may inspect a card and locate its artwork, but cannot control its lifetime. */
export type BoardCard = Pick<Card, 'container' | 'state'>;

/** Internal animation coordination; borrows cards without owning their lifetime. */
export interface BoardTransitions {
  /** Starts forward-staggered entrances once and reports when all have settled. */
  show(onComplete: () => void): void;
  /** Starts reverse-staggered exits once and resolves when all have finished. */
  hide(): Promise<void>;
  /** Rejects a pending wait and prevents future starts; does not destroy cards. */
  destroy(): void;
}

/** Scene callbacks keep audio and runtime completion out of the board feature. */
export interface BoardCallbacks {
  /** Called once after every card has finished or settled its entrance. */
  readonly onEntranceComplete: () => void;
  /** Called once when a card accepts input, before its reveal animation finishes. */
  readonly onCardRevealStarted: () => void;
  /** Called once after every card has finished revealing its front. */
  readonly onAllCardsRevealed: () => void;
}

/** Owns card views and reports a finished puzzle without owning runtime completion. */
export interface Board {
  readonly container: Container;
  /** Starts card entrances after scene composition, never during card creation. */
  show(): void;
  /** Returns currently unopened cards in layout order; stopped boards return none. */
  getUnopenedCards(): readonly BoardCard[];
  /** Switches card placement without recreating their views. */
  resize(): void;
  /** Disables input and completion reporting; current reveal animations may finish. */
  stop(): void;
  /** Resolves after every card exits; repeated calls share the wait, destruction rejects with AbortError. */
  hide(): Promise<void>;
  /** Releases card views before their containing layout. */
  destroy(): void;
}
