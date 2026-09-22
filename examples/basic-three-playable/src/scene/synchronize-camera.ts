import { playable } from '@replayablejs/runtime';
import { MathUtils, Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';

// Smaller span means a closer view. This is the minimum visible width and height.
const visibleSpan = 6;

// Fraction of screen height measured from the top: 0.5 is the screen center.
const portraitPlotPosition = 0.56;
const landscapePlotPosition = 0.5;

/** Applies the example's camera framing now and whenever the viewport changes. */
export function synchronizeCamera(camera: PerspectiveCamera): () => void {
  const stopResizing = playable.on('resize', updateFraming);

  updateFraming();

  return stopResizing;

  function updateFraming(): void {
    const { frame } = playable.screen;
    if (frame === undefined || frame.width <= 0 || frame.height <= 0) {
      return;
    }

    // 1. Keep enough world space visible in both dimensions, regardless of orientation.
    const aspect = frame.width / frame.height;
    const baseHeight = Math.max(visibleSpan, visibleSpan / aspect);
    const visibleHeight = baseHeight * tabletZoomOut(aspect);
    const distance = cameraDistanceForHeight(camera, visibleHeight);

    // 2. View the plots from across the road, facing the new buildings' entrances.
    const plotCenter = new Vector3(0, 0.065, -2);
    const viewingDirection = new Vector3(1, 1.3, 1).normalize();
    camera.position.copy(plotCenter).addScaledVector(viewingDirection, distance);
    camera.lookAt(plotCenter);

    // 3. Keep the plots slightly below center and a little to the right.
    // Move the camera in its own view without changing its angle or zoom.
    const plotPosition = aspect < 1 ? portraitPlotPosition : landscapePlotPosition;
    camera.translateY((plotPosition - 0.5) * visibleHeight);
    camera.translateX(-0.05 * visibleHeight * aspect);
    camera.updateMatrixWorld();
  }
}

/** Perspective geometry: half the visible height = distance × tan(half the field of view). */
function cameraDistanceForHeight(camera: PerspectiveCamera, visibleHeight: number): number {
  const halfFieldOfView = MathUtils.degToRad(camera.fov / 2);
  return visibleHeight / 2 / Math.tan(halfFieldOfView);
}

/**
 * Squarer screens need more breathing room than tall/wide phones. Blend the
 * extra distance smoothly: up to 25% in tablet landscape and 15% in portrait.
 * Using the frame shape also works in split-screen, without device detection.
 */
function tabletZoomOut(aspect: number): number {
  const shortToLongRatio = Math.min(aspect, 1 / aspect);
  const tabletBlend = MathUtils.clamp((shortToLongRatio - 0.55) / 0.2, 0, 1);
  const extraDistance = aspect >= 1 ? 0.25 : 0.15;
  return 1 + tabletBlend * extraDistance;
}
