import { playable } from '@replayablejs/runtime';
import { Scene } from 'three';

import { setupThreeIntegrations } from '#integrations/setup-three-integrations.js';
import { cleanupThreeResources, failThreeSetup } from '#lifecycle/cleanup-three-resources.js';
import { loadThreeModel } from '#loader/load-three-model.js';
import { loadThreeTexture } from '#loader/load-three-texture.js';
import { createThreeRenderer } from '#renderer/create-three-renderer.js';
import { startThreeRendering } from '#renderer/start-three-rendering.js';
import { synchronizeThreeScreen } from '#renderer/synchronize-three-screen.js';
import type { CreateThreeOptions, ReplayableThree } from '#types/three.js';

/** Initializes Three.js around Replayable's assets, lifecycle, and shared canvas. */
export function createThree(options: CreateThreeOptions): ReplayableThree {
  const { camera } = options;
  const cleanups: (() => void)[] = [];

  try {
    cleanups.push(playable.loader.register('models', loadThreeModel));
    cleanups.push(playable.loader.register('textures', loadThreeTexture));
    cleanups.push(setupThreeIntegrations(options.integrations));

    const { renderer, destroy } = createThreeRenderer(options);
    cleanups.push(destroy);

    // Detach scene children before releasing the renderer; application-created
    // geometry, materials, and textures remain caller-owned.
    const scene = new Scene();
    cleanups.push(() => scene.clear());

    const stopScreenSynchronization = synchronizeThreeScreen(renderer, camera);
    cleanups.push(stopScreenSynchronization);

    const stopRendering = startThreeRendering(renderer, scene, camera);
    cleanups.push(stopRendering);

    return {
      renderer,
      scene,
      camera,

      destroy(): void {
        // Draining the stack makes destruction idempotent, even after an error.
        cleanupThreeResources(cleanups);
      },
    };
  } catch (error) {
    return failThreeSetup(error, cleanups);
  }
}
