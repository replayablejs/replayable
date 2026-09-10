import type { Container } from 'pixi.js';

/** Button behavior around caller-created artwork; no automatic layout or animation. */
export interface CreateButtonOptions {
  /** Ownership transfers to the button. Create and size the artwork before passing it. */
  readonly content: Container;
  /** Runs synchronously on a completed tap, after propagation has been stopped. */
  readonly onActivate: () => void;
  readonly enabled?: boolean;
}

/** A stable interaction container whose child artwork may animate independently. */
export interface ReplayableButton {
  readonly container: Container;
  /** Disabling leaves the button visible but non-interactive; it does not dim artwork. */
  setEnabled(this: void, enabled: boolean): void;
  /** Removes listeners and destroys owned artwork, retaining shared asset textures. */
  destroy(this: void): void;
}
