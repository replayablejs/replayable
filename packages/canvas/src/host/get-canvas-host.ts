import { playable } from '@replayablejs/runtime';

import type { CanvasHost, SharedRenderingContext } from '#types/canvas-host.js';
import { registerWebglContext } from '#webgl-stats';

import { REPLAYABLE_CANVAS_ID } from './canvas-ids.js';
import { installCanvasStyles } from './install-canvas-styles.js';

let sharedCanvasHost: CanvasHost | undefined;

/** Returns the canvas host shared by every renderer in the playable. */
export function getCanvasHost(): CanvasHost {
  sharedCanvasHost ??= createCanvasHost();

  return sharedCanvasHost;
}

/**
 * Creates a replayable canvas host and mounts it into the runtime container.
 *
 * The host only owns DOM placement and shared-context handoff; it never creates
 * or configures rendering contexts itself.
 */
function createCanvasHost(): CanvasHost {
  installCanvasStyles();

  const canvas = document.createElement('canvas');
  let destroyed = false;
  let sharedContext: SharedRenderingContext | null = null;
  let unregisterContext: (() => void) | undefined;

  canvas.id = REPLAYABLE_CANVAS_ID;
  playable.container.append(canvas);

  const host: CanvasHost = {
    getCanvas: () => canvas,
    getSharedContext: (): SharedRenderingContext | null => sharedContext,
    setSharedContext,
    destroy,
  };

  return host;

  /** Commits the renderer's context only after registration succeeds, allowing retries. */
  function setSharedContext(context: SharedRenderingContext): void {
    if (destroyed) {
      throw new Error('Cannot register a WebGL context on a destroyed Replayable canvas host.');
    }

    // Both renderers may report the same shared context; register it only once.
    if (sharedContext === context) {
      return;
    }
    if (sharedContext !== null) {
      throw new Error('Replayable canvas already has a different WebGL context.');
    }

    unregisterContext = registerWebglContext(context);
    sharedContext = context;
  }

  /** Releases local ownership before notifying observers, whose cleanup may throw. */
  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;

    const unregister = unregisterContext;
    unregisterContext = undefined;
    sharedContext = null;
    canvas.remove();

    if (sharedCanvasHost === host) {
      sharedCanvasHost = undefined;
    }

    // Errors still reach the caller, but cannot leave a mounted or reusable dead host.
    unregister?.();
  }
}
