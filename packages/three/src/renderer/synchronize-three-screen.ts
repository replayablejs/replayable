import { playable } from '@replayablejs/runtime';
import type { PerspectiveCamera, WebGLRenderer } from 'three';

/**
 * Synchronizes drawing-buffer dimensions and camera aspect with the runtime screen.
 *
 * Frame dimensions are logical pixels; resolution supplies the device/render-scale
 * multiplier. The canvas host owns CSS sizing, so setSize must not write styles.
 * Resizing retains camera position, vertical field of view, and clipping planes.
 *
 * Subscribe before reading the snapshot to support setup both before and after
 * readiness. Ignore zero-area frames rather than writing an invalid aspect ratio.
 * If the initial synchronization fails, release the subscription before propagating.
 */
export function synchronizeThreeScreen(
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
): () => void {
  const unsubscribe = playable.on('resize', applyScreen);

  try {
    if (playable.screen.frame !== undefined) {
      applyScreen();
    }
  } catch (error) {
    unsubscribe();
    throw error;
  }
  return unsubscribe;

  function applyScreen(): void {
    const { frame, resolution } = playable.screen;
    if (frame === undefined || frame.width <= 0 || frame.height <= 0) {
      return;
    }
    renderer.setPixelRatio(resolution);
    renderer.setSize(frame.width, frame.height, false);
    camera.aspect = frame.width / frame.height;
    camera.updateProjectionMatrix();
  }
}
