import type { Container } from 'pixi.js';

/** Branding, persistent CTA, and sound owned by the UI layer. */
export interface SceneInterface {
  readonly container: Container;
  /** Resolves after moving or resizing to the destination; destruction rejects with AbortError. */
  moveLogoToEndCard(): Promise<void>;
  destroy(): void;
}
