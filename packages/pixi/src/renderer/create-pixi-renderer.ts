import { getCanvasHost, type SharedRenderingContext } from '@replayablejs/canvas';
import { playable } from '@replayablejs/runtime';
import { WebGLRenderer } from 'pixi.js';

import { cleanupPixiResources, failPixiSetup } from '#lifecycle/cleanup-pixi-resources.js';
import type { CreatePixiOptions, PixiRendererResult } from '#types/pixi.js';

import { destroyPixiRenderer } from './destroy-pixi-renderer.js';

/** Creates Pixi's renderer on Replayable's canvas and shared WebGL context. */
export async function createPixiRenderer(options: CreatePixiOptions): Promise<PixiRendererResult> {
  const canvasHost = getCanvasHost();
  const sharedContext = resolveSharedContext(canvasHost.getSharedContext());
  const ownsContext = sharedContext === null;
  const cleanups: (() => void)[] = [];

  if (ownsContext) {
    // Capture this host, never resolve the singleton again during destruction.
    cleanups.push(() => canvasHost.destroy());
  }

  try {
    const renderer = new WebGLRenderer();
    cleanups.push(() => destroyPixiRenderer(renderer, ownsContext));

    await renderer.init({
      antialias: options.antialias ?? false,
      autoDensity: false,
      backgroundAlpha: ownsContext ? 1 : 0,
      backgroundColor: playable.config.backgroundColor,
      canvas: canvasHost.getCanvas(),
      clearBeforeRender: ownsContext,
      context: sharedContext,
      hello: false,
      powerPreference: options.powerPreference ?? 'high-performance',
      preferWebGLVersion: 2,
      useBackBuffer: options.useBackBuffer ?? false,
    });

    if (ownsContext) {
      canvasHost.setSharedContext(renderer.gl);
    }

    return { renderer, destroy: () => cleanupPixiResources(cleanups) };
  } catch (error) {
    return failPixiSetup(error, cleanups);
  }
}

/** Pixi 8 accepts only WebGL 2 when reusing an externally created context. */
function resolveSharedContext(
  context: SharedRenderingContext | null,
): WebGL2RenderingContext | null {
  if (
    context === null ||
    (typeof WebGL2RenderingContext !== 'undefined' && context instanceof WebGL2RenderingContext)
  ) {
    return context;
  }

  throw new Error('Pixi requires the shared Replayable canvas context to use WebGL 2.');
}
