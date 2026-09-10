import type { Container } from 'pixi.js';

/** Stable logo layout box with independently animated artwork. */
export interface SceneLogo {
  readonly container: Container;
  destroy(): void;
}

/** One-shot logo transition; borrows the interface layout and existing logo. */
export interface LogoMovement {
  moveToEndCard(this: void): Promise<void>;
  /** Stop animation before relayout without settling the pending transition. */
  stop(): void;
  /** Complete the wait after the destination is reached by animation or relayout. */
  finish(): void;
  /** Reject pending movement without destroying the borrowed logo or layout. */
  destroy(): void;
}
