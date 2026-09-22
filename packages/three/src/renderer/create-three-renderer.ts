import { getCanvasHost, type SharedRenderingContext } from '@replayablejs/canvas';
import { playable } from '@replayablejs/runtime';
import { WebGLRenderer, type WebGLRendererParameters } from 'three';

import { cleanupThreeResources, failThreeSetup } from '#lifecycle/cleanup-three-resources.js';
import type { CreateThreeOptions, ThreeRendererResult } from '#types/three.js';

/**
 * Creates a WebGL 2 renderer using the exact shared host acquired for this lifetime.
 *
 * The first renderer owns the canvas and clears each frame to the configured
 * background. A borrowing renderer reuses the existing context and does not clear
 * another renderer's color output. Antialiasing and power preference cannot change
 * the attributes of a borrowed context.
 *
 * Disposing Three.js releases renderer-managed allocations without forcing context
 * loss. Only the owner removes the canvas host. Register cleanup immediately after
 * each acquisition so failure during configuration also releases acquired resources.
 */
export function createThreeRenderer(options: CreateThreeOptions): ThreeRendererResult {
  const host = getCanvasHost();
  const context = resolveSharedContext(host.getSharedContext());
  const ownsCanvas = context === null;
  const cleanups: (() => void)[] = [];

  if (ownsCanvas) {
    cleanups.push(() => host.destroy());
  }

  try {
    const renderer = initializeRenderer(host.getCanvas(), context, options);
    cleanups.push(() => renderer.dispose());

    configureFrameClearing(renderer, ownsCanvas);
    if (ownsCanvas) {
      host.setSharedContext(renderer.getContext());
    }

    return { renderer, destroy: () => cleanupThreeResources(cleanups) };
  } catch (error) {
    return failThreeSetup(error, cleanups);
  }
}

/**
 * Constructs the renderer with explicit defaults and an optional borrowed context.
 *
 * Omit context entirely when Three.js must create it. A borrower requests alpha
 * support for compositing, but the existing context's attributes remain decisive.
 * Construction does not configure clearing or register the context: the caller
 * must first record renderer disposal so either of those later steps can fail safely.
 */
function initializeRenderer(
  canvas: HTMLCanvasElement,
  context: WebGL2RenderingContext | null,
  options: CreateThreeOptions,
): WebGLRenderer {
  const parameters: WebGLRendererParameters = {
    canvas,
    alpha: context !== null,
    antialias: options.antialias ?? false,
    powerPreference: options.powerPreference ?? 'high-performance',
  };

  if (context !== null) {
    parameters.context = context;
  }

  return new WebGLRenderer(parameters);
}

/**
 * Gives the owner an opaque background and preserves existing output for borrowers.
 *
 * Disabling autoClear leaves color, depth, and stencil intact. Applications sharing
 * renderers therefore own their composition order and any intermediate depth clear.
 */
function configureFrameClearing(renderer: WebGLRenderer, ownsCanvas: boolean): void {
  renderer.autoClear = ownsCanvas;
  renderer.setClearColor(playable.config.backgroundColor, ownsCanvas ? 1 : 0);
}

/** Rejects an incompatible borrowed context without taking ownership of its host. */
function resolveSharedContext(
  context: SharedRenderingContext | null,
): WebGL2RenderingContext | null {
  if (context === null) {
    return null;
  }

  if (typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext) {
    return context;
  }

  throw new Error('Three.js requires the shared Replayable canvas context to use WebGL 2.');
}
