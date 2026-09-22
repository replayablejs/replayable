import { playable } from '@replayablejs/runtime';
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

/**
 * Renders once per runtime update without acquiring an independent RAF loop.
 *
 * Replayable controls readiness, visibility, and scheduling. Reset Three.js's GL
 * state before drawing because another renderer may have used the shared context.
 * Animation timing belongs to the playable; this callback only renders the scene.
 * The returned unsubscribe stops rendering during cleanup or setup rollback.
 */
export function startThreeRendering(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
): () => void {
  return playable.update.add(() => {
    renderer.resetState();
    renderer.render(scene, camera);
  });
}
