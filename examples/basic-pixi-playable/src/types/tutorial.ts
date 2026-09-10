import type { Container, SplitText } from 'pixi.js';

/** Character keyframes and absolute start times passed to Replayable's sequence animator. */
export type TutorialTextSequence = Array<
  [
    SplitText['chars'][number],
    { alpha: number[]; x: number[]; y: number[] },
    { at: number; duration: number; ease: 'easeInOut' | 'easeOut' },
  ]
>;

/** One letter's resting pose and center-relative timing data, measured before animation. */
export interface TutorialTextCharacter {
  readonly character: SplitText['chars'][number];
  readonly restingX: number;
  readonly restingY: number;
  readonly distance: number;
  readonly inwardOffset: number;
}

/** Presentation owned by the tutorial lifecycle, with no timers or gameplay rules. */
export interface TutorialScroll {
  readonly container: Container;
  /** Opens paper and text together; called once by the owner. */
  open(): void;
  /** Reverses the current presentation, then hides it without changing its bounds. */
  close(): void;
  destroy(): void;
}

/** One split sentence whose lifecycle is owned by its tutorial scroll. */
export interface TutorialText {
  readonly container: Container;
  /** Expands from the center over the scroll's opening duration, in seconds. */
  reveal(duration: number): void;
  /** Retracts visible letters toward the center over the scroll's closing duration. */
  dismiss(duration: number): void;
  destroy(): void;
}

/** Optional guidance whose reserved layout box survives its dismissal. */
export interface Tutorial {
  readonly container: Container;
  /** Opens once after the board entrance; starts the visible tutorial duration. */
  show(): void;
  /** Closes the scroll once without consuming the player's gameplay tap. */
  dismiss(): void;
  /** Immediately releases presentation work and invalidates the pending timeout. */
  destroy(): void;
}
