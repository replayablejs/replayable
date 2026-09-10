import { playable } from '@replayablejs/runtime';
import type { WebGLRenderer } from 'pixi.js';

/** Keeps Pixi's drawing buffer aligned with Replayable's screen. */
export function synchronizePixiScreen(renderer: WebGLRenderer): () => void {
  const unsubscribe = playable.on('resize', applyScreen);

  try {
    // Renderer initialization is asynchronous. The initial resize may have
    // happened while it was awaiting Pixi; catch up without starting readiness.
    if (playable.screen.frame !== undefined) {
      applyScreen();
    }
  } catch (error) {
    unsubscribe();
    throw error;
  }

  return unsubscribe;

  function applyScreen(): void {
    const { frame, resolution } = playable.screen;

    renderer.resolution = resolution;
    renderer.resize(frame.width, frame.height);
  }
}
