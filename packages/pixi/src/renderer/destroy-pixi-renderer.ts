import type { WebGLRenderer } from 'pixi.js';

/**
 * Releases Pixi resources without forcibly losing a borrowed WebGL context.
 *
 * Pixi 8.20's GlContextSystem.destroy() calls its cached loseContext extension;
 * removeView:false only preserves the canvas element. There is no preserve-context
 * destroy option. Temporarily remove that entry from this renderer's own cache,
 * not from the shared WebGL context or the extension object another renderer uses.
 * Recheck this compatibility boundary when upgrading Pixi.
 */
export function destroyPixiRenderer(renderer: WebGLRenderer, ownsContext: boolean): void {
  // Context systems may not exist yet if asynchronous initialization failed early.
  const extensions = renderer.context?.extensions;
  const loseContext = extensions?.loseContext;

  if (!ownsContext && extensions !== undefined) {
    delete extensions.loseContext;
  }

  try {
    renderer.destroy({ removeView: false });
  } finally {
    if (!ownsContext && extensions !== undefined && loseContext !== undefined) {
      extensions.loseContext = loseContext;
    }
  }
}
