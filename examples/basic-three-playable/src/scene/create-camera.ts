import { PerspectiveCamera } from 'three';

/**
 * Looks down on the neighborhood from a fixed angle, like the City Builder
 * reference. Replayable supplies the viewport aspect after initialization.
 * The main scene frames the playable plots after loading and on every resize.
 */
export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(12, 12, 12);
  camera.lookAt(0, 0, 0);
  return camera;
}
