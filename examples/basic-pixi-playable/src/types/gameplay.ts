import type { Container } from 'pixi.js';

import type { Board } from './board';
import type { Tutorial } from './tutorial';

/** Existing features borrowed by placement; absent controls reserve no space. */
export interface GameplayPlacementOptions {
  readonly board: Board;
  readonly tutorial: Tutorial | undefined;
}

/** Safe-area layout whose lifetime belongs to gameplay, not to the borrowed features. */
export interface GameplayPlacement {
  readonly container: Container;
  resize(): void;
  destroy(): void;
}

/** Only enabled features reserve space in the portrait scene. */
export interface SceneLayoutFeatures {
  readonly tutorial: boolean;
}

/** Cards and gameplay guidance, kept alive through their exit animation. */
export interface SceneGameplay {
  readonly container: Container;
  /** Stop input immediately without hiding the final rendered card pose. */
  stop(): void;
  /** Resolves after card exit; destruction rejects a pending wait with AbortError. */
  hide(): Promise<void>;
  destroy(): void;
}
