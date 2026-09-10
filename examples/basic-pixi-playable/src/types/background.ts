import type { Container, Filter } from 'pixi.js';

/** Filter resources and the live uniform object animated by the dissolve controller. */
export interface DissolveFilter {
  readonly filter: Filter;
  readonly uniforms: { uProgress: number };
}

/** Fullscreen artwork and its one-shot game-to-endcard transition. */
export interface SceneBackground {
  readonly container: Container;
  transitionToEndCard(): BackgroundTransition;
  destroy(): void;
}

/** The popup may enter at the midpoint while the background continues dissolving. */
export interface BackgroundTransition {
  /** Resolves at halfway progress; destruction rejects a pending wait with AbortError. */
  readonly midpoint: Promise<void>;
}

/** Midpoint bookkeeping shared by the animation's update, completion, and cancellation. */
export interface DissolveProgress extends BackgroundTransition {
  /** Accepts normalized animation progress from zero to one. */
  update(value: number): void;
  /** Rejects the midpoint only while it is still pending. */
  cancel(): void;
}

/** One-shot effect owned by the background layer, not by the scene coordinator. */
export interface BackgroundDissolve {
  /** Repeated starts share the same midpoint; starts after destruction throw AbortError. */
  start(): BackgroundTransition;
  /** Cancels the effect without destroying its sprite or shared textures. */
  destroy(): void;
}
