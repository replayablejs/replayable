declare module '#webgl-stats' {
  import type { SharedRenderingContext } from '#types/canvas-host.js';

  /** Development-only context handoff selected by Replayable's Vite pipeline. */
  export function registerWebglContext(context: SharedRenderingContext): () => void;
}
