/* eslint-disable no-underscore-dangle -- Pixi DevTools requires these exact global names. */

import type { Container, WebGLRenderer } from 'pixi.js';

/** Exposes a successfully initialized stage and renderer to Pixi DevTools in development. */
export function registerPixiDevtools(stage: Container, renderer: WebGLRenderer): () => void {
  if (!import.meta.env.DEV) {
    return noop;
  }

  // Replayable owns these separately, not through a PIXI.Application instance.
  globalThis.__PIXI_STAGE__ = stage;
  globalThis.__PIXI_RENDERER__ = renderer;

  return unregister;

  /** Releases only our references; an older instance must not clear a newer registration. */
  function unregister(): void {
    if (globalThis.__PIXI_STAGE__ === stage) {
      Reflect.deleteProperty(globalThis, '__PIXI_STAGE__');
    }
    if (globalThis.__PIXI_RENDERER__ === renderer) {
      Reflect.deleteProperty(globalThis, '__PIXI_RENDERER__');
    }
  }
}

/** Keeps lifecycle cleanup unconditional when production strips the DevTools branch. */
function noop(): void {}
