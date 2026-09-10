import type { Container } from 'pixi.js';

/** Owns entrance playback and completion, borrowing existing popup and CTA artwork. */
export interface EndCardEntrance {
  /** Resolves after entrance; repeated calls share the wait, destruction rejects with AbortError. */
  show(): Promise<void>;
  /** Stops playback and rejects a pending wait without destroying any scene objects. */
  destroy(): void;
}

/** Terminal presentation; runtime owns the reason and timing of completion. */
export interface EndCard {
  readonly container: Container;
  /** Resting popup top in endcard-local coordinates, unaffected by entrance animation. */
  readonly popupTop: number;
  /** Resolves after popup and CTA entrance; destruction rejects a pending wait with AbortError. */
  show(): Promise<void>;
  destroy(): void;
}

/** Separates attention animation from the button's input and press animation. */
export interface EndCardButton {
  readonly container: Container;
  playAttention(): void;
  destroy(): void;
}
