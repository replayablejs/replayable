import type { Spine } from '@esotericsoftware/spine-pixi-v8';
import type { Container, Rectangle } from 'pixi.js';

/** Display objects and immutable sizing reference; owns no input or reveal state. */
export interface CardView {
  readonly container: Container;
  readonly spine: Spine;
  readonly bounds: Rectangle;
}

/** Artwork entrance/exit only; settling never changes the card's reveal state. */
export interface CardTransitions {
  show(this: void, delay: number, onComplete: () => void): void;
  /** Finish entrance immediately and report its completion once. */
  settle(this: void): void;
  hide(this: void, delay: number, onComplete: () => void): void;
  /** Stop tweens before their targets are destroyed. */
  destroy(this: void): void;
}

/** A card becomes unavailable when its reveal starts, not when it finishes. */
export type CardState = 'back' | 'flipping' | 'revealed';

/** Notifications for the board and effects; the view owns no puzzle progress. */
export interface CardOptions {
  readonly onRevealStarted?: () => void;
  readonly onRevealCompleted?: () => void;
}

/** One interactive card with a stable layout box around its animated artwork. */
export interface Card {
  readonly container: Container;
  readonly state: CardState;
  /** Starts entrance; the card becomes interactive only after it finishes. */
  show(delay: number, onComplete: () => void): void;
  /** Prevents activation without interrupting a reveal already in progress. */
  stopInput(): void;
  /** Reverses the entrance after a stagger delay, then reports the finished exit. */
  hide(delay: number, onComplete: () => void): void;
  /** Releases listeners and display objects, but not shared textures. */
  destroy(): void;
}
