export interface Gameplay {
  readonly container: HTMLElement;
  show(): void;
  /** Freeze gameplay immediately while retaining the final answer on screen. */
  stop(): void;
  destroy(): void;
}
