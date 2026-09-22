import { Group } from 'three';
import type { Texture } from 'three';

import { createBuildingPlots } from './create-building-plots';
import { createNeighborhoodLayout } from './create-neighborhood-layout';
import { createNeighborhoodScenery } from './create-neighborhood-scenery';

/** Composes the static scenery and the three markers where players will build. */
export function createNeighborhood(palette: Texture) {
  const root = new Group();
  root.name = 'neighborhood';

  const layout = createNeighborhoodLayout();
  const scenery = createNeighborhoodScenery(layout, palette);
  const plots = createBuildingPlots(scenery);
  root.add(scenery.root, plots.root);

  return {
    root,
    createInstance: scenery.createInstance,
    hidePlot: plots.hidePlot,
    plotMarkers: plots.markers,
    lowerGround: scenery.lowerTile,
    destroy,
  };

  /** Each layer releases the objects and GPU resources it created. */
  function destroy(): void {
    root.removeFromParent();
    plots.destroy();
    scenery.destroy();
    root.clear();
  }
}
