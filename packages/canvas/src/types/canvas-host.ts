export interface CanvasHost {
  /** Returns the canvas mounted inside Replayable's runtime container. */
  getCanvas(): HTMLCanvasElement;

  /** Returns the WebGL context registered by a renderer, or `null` before registration. */
  getSharedContext(): SharedRenderingContext | null;

  /** Registers the first renderer's context; rejects replacement or use after destruction. */
  setSharedContext(context: SharedRenderingContext): void;

  /** Removes the canvas once and lets the next access create a fresh shared host. */
  destroy(): void;
}

export type SharedRenderingContext = WebGLRenderingContext | WebGL2RenderingContext;
