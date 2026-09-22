import { getCanvasHost } from '@replayablejs/canvas';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';

import { buildingPlots } from '../../scene/neighborhood-layout';
import { plotInputConfig } from './configs/plot-input';

/** Creates a picker that reuses its ray and vectors across pointer releases. */
export function createPlotPicker(camera: PerspectiveCamera) {
  const canvas = getCanvasHost().getCanvas();
  const raycaster = new Raycaster();
  const screenPointer = new Vector2();
  const groundPoint = new Vector3();
  const plotPlane = new Plane(new Vector3(0, 1, 0), -plotInputConfig.height);

  return pickPlot;

  /** Project the pointer onto the plot plane, then find the cell containing it. */
  function pickPlot(clientX: number, clientY: number): number {
    const bounds = canvas.getBoundingClientRect();
    if (bounds.width === 0 || bounds.height === 0) {
      return -1;
    }

    // Convert canvas-local CSS pixels into Three.js coordinates: -1 to +1,
    // with y pointing upward. Canvas bounds account for letterboxing and DPI.
    const canvasX = (clientX - bounds.left) / bounds.width;
    const canvasY = (clientY - bounds.top) / bounds.height;
    screenPointer.set(canvasX * 2 - 1, 1 - canvasY * 2);

    camera.updateMatrixWorld();
    raycaster.setFromCamera(screenPointer, camera);
    if (raycaster.ray.intersectPlane(plotPlane, groundPoint) === null) {
      return -1;
    }

    return buildingPlots.findIndex(containsGroundPoint);
  }

  /** The entire pavement cell is tappable, including the empty ring center. */
  function containsGroundPoint(plot: { x: number; z: number }): boolean {
    const distanceX = Math.abs(groundPoint.x - plot.x);
    const distanceZ = Math.abs(groundPoint.z - plot.z);
    return distanceX <= plotInputConfig.halfSize && distanceZ <= plotInputConfig.halfSize;
  }
}
