import type { Container } from 'pixi.js';

/** Example-owned scene mounted beneath Replayable's renderer-owned stage. */
export interface MainScene {
  readonly container: Container;

  /** Releases scene resources before the Pixi renderer is destroyed. */
  destroy(): void;
}
