import type { Container } from 'pixi.js';

/** A button whose content handles its own press animation, independent of placement. */
export interface Control {
  readonly container: Container;
  /** Hides and disables the button while preserving its layout bounds. */
  hide(this: void): void;
  /** Releases input, animation, and display objects without destroying shared textures. */
  destroy(this: void): void;
}
