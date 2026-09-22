import { Group, Mesh, MeshBasicMaterial, RingGeometry } from 'three';

import { models } from '../assets/registries/models';
import type { CityModelInstance } from '../types/city-instances';
import type { createNeighborhoodScenery } from './create-neighborhood-scenery';
import { buildingPlots } from './neighborhood-layout';

/** Marks empty plots and hides each outline when its building is placed. */
export function createBuildingPlots(scenery: ReturnType<typeof createNeighborhoodScenery>) {
  const root = new Group();
  root.name = 'building-plots';

  // A four-sided ring becomes a square outline, laid flat just above the pavement.
  // All markers share the same geometry and material.
  const geometry = new RingGeometry(0.3, 0.37, 4);
  geometry.rotateX(-Math.PI / 2);
  geometry.rotateY(Math.PI / 4);
  const material = new MeshBasicMaterial({ color: '#ffe897' });

  const markers: Mesh[] = [];
  const pavements: CityModelInstance[] = [];
  for (const plot of buildingPlots) {
    const pavement = scenery.createInstance({ asset: models['city/pavement'], ...plot });
    pavements.push(pavement);

    const marker = new Mesh(geometry, material);
    marker.position.set(plot.x, 0.065, plot.z);
    root.add(marker);
    markers.push(marker);
  }

  return { root, markers, hidePlot, destroy };

  function hidePlot(index: number): void {
    const marker = markers[index];
    if (marker !== undefined) {
      marker.visible = false;
      // The placed model supplies its own stationary, full-size ground tile.
      const pavement = pavements[index]!;
      pavement.root.visible = false;
      pavement.update();
    }
  }

  function destroy(): void {
    root.removeFromParent();
    for (const pavement of pavements) {
      pavement.destroy();
    }
    root.clear();
    geometry.dispose();
    material.dispose();
  }
}
