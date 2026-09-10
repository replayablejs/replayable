import { playable } from '@replayablejs/runtime';
import { Container } from 'pixi.js';

import { registerPixiDevtools } from '#integrations/register-pixi-devtools.js';
import { setupPixiIntegrations } from '#integrations/setup-pixi-integrations.js';
import { cleanupPixiResources, failPixiSetup } from '#lifecycle/cleanup-pixi-resources.js';
import { configurePixiAssets } from '#loader/configure-pixi-assets.js';
import { loadPixiAtlas } from '#loader/load-pixi-atlas.js';
import { loadPixiSprite } from '#loader/load-pixi-sprite.js';
import { createPixiRenderer } from '#renderer/create-pixi-renderer.js';
import { startPixiRendering } from '#renderer/start-pixi-rendering.js';
import { synchronizePixiScreen } from '#renderer/synchronize-pixi-screen.js';
import type { CreatePixiOptions, ReplayablePixi } from '#types/pixi.js';

/** Initializes Pixi around Replayable's assets, lifecycle, and shared canvas. */
export async function createPixi(options: CreatePixiOptions = {}): Promise<ReplayablePixi> {
  configurePixiAssets();

  const cleanups: (() => void)[] = [];

  try {
    // Register before the first await, so readiness can load primary assets.
    // Record each release immediately: any later acquisition may fail.
    cleanups.push(playable.loader.register('atlases', loadPixiAtlas));
    cleanups.push(playable.loader.register('sprites', loadPixiSprite));
    cleanups.push(setupPixiIntegrations(options.integrations));

    const { renderer, destroy } = await createPixiRenderer(options);
    cleanups.push(destroy);

    // Acquire the stage after the renderer so reverse cleanup destroys scene
    // objects while their renderer is still alive.
    const stage = new Container();
    cleanups.push(() => stage.destroy({ children: true }));

    const stopScreenSynchronization = synchronizePixiScreen(renderer);
    cleanups.push(stopScreenSynchronization);

    const stopRendering = startPixiRendering(renderer, stage);
    cleanups.push(stopRendering);

    const unregisterDevtools = registerPixiDevtools(stage, renderer);
    cleanups.push(unregisterDevtools);

    return {
      renderer,
      stage,

      destroy(): void {
        // Draining the stack makes destruction idempotent, even after an error.
        cleanupPixiResources(cleanups);
      },
    };
  } catch (error) {
    return failPixiSetup(error, cleanups);
  }
}
