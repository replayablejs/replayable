import { playable } from '@replayablejs/runtime';
import { disposeModelAsset } from '@replayablejs/three';
import type { PerspectiveCamera, Scene } from 'three';

import { models } from '../assets/registries/models';
import { createGameplay } from './create-gameplay';
import { createLighting } from './create-lighting';
import { createNeighborhood } from './create-neighborhood';
import { createEndCard } from './interface/create-end-card';
import { createInterface } from './interface/create-interface';
import { prepareCityPalette } from './prepare-city-palette';
import { synchronizeCamera } from './synchronize-camera';

interface MainSceneConfig {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
}

/** Composes the neighborhood, lighting, and camera after primary assets have loaded. */
export function createMainScene({ scene, camera }: MainSceneConfig): { destroy(): void } {
  // Every building and tile uses the same separately loaded color palette.
  const palette = prepareCityPalette();
  const neighborhood = createNeighborhood(palette);
  const lighting = createLighting();
  const gameplay = createGameplay({
    camera,
    neighborhood,
  });

  const ui = createInterface();
  let endCard: ReturnType<typeof createEndCard> | undefined;
  const removeCompletion = playable.on('complete', showEndCard);

  // Mount the scene before positioning the camera over the building plots.
  scene.add(neighborhood.root, lighting.root);
  const stopCameraSynchronization = synchronizeCamera(camera);

  let destroyed = false;
  return { destroy };

  /** Create the end card only when gameplay completes. */
  function showEndCard(): void {
    endCard = createEndCard();
    //
    ui.hidePersistentCta();
    ui.moveLogoToEndCardPosition();
    endCard.show();
  }

  /** Stop scene work, remove its objects, then release the assets they shared. */
  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;

    removeCompletion();
    stopCameraSynchronization();
    endCard?.destroy();
    ui.destroy();
    gameplay.destroy();
    neighborhood.destroy();
    lighting.destroy();
    disposeAssets();
  }

  /** Model instances must be gone before their shared geometry and materials. */
  function disposeAssets(): void {
    for (const asset of Object.values(models)) {
      disposeModelAsset({ asset });
    }

    // This texture was loaded separately, so model disposal does not own it.
    palette.dispose();
  }
}
