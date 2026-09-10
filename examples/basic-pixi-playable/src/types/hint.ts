import type { Container, PointData } from 'pixi.js';

import type { BoardCard } from './board';

/** One card's target position and proportional hand scale for the hint sequence. */
export interface HintTargetPlacement {
  readonly position: PointData;
  readonly scale: number;
}

/** Non-interactive presentation owned by the hint lifecycle. */
export interface HintHand {
  readonly container: Container;
  readonly visible: boolean;
  /** Demonstrates supplied cards without changing their state or dispatching input. */
  show(cards: readonly BoardCard[], onComplete: () => void): void;
  /** Cancels silently, so interruption never schedules another hint by itself. */
  cancel(): void;
  destroy(): void;
}

/** Application-only hand guidance; it never changes board progress. */
export interface Hint {
  readonly container: Container;
  /** Cancels an outdated visible route after refitting; the next hint uses the new layout. */
  resize(): void;
  /** Permanently stops inactivity, animation, and input subscriptions. */
  stop(): void;
  destroy(): void;
}
