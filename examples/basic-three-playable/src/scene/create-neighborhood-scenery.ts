import { Group, Matrix4 } from 'three';
import type { InstancedMesh, Texture } from 'three';

import { models } from '../assets/registries/models';
import { buildings } from '../features/building/configs/buildings';
import { createCityModelBatch } from './create-city-model-batch';
import { buildingPlots, road } from './neighborhood-layout';
import type { NeighborhoodTile } from './neighborhood-layout';

/** Owns shared instance batches for both the starting city and player placements. */
export function createNeighborhoodScenery(layout: readonly NeighborhoodTile[], palette: Texture) {
  const root = new Group();
  root.name = 'neighborhood-scenery';
  const batches = new Map<NeighborhoodTile['asset'], ReturnType<typeof createCityModelBatch>>();
  const loweredCells = new Set<string>();
  const cells = new Map<string, { mesh: InstancedMesh; index: number }[]>();

  for (const asset of new Set(layout.map((tile) => tile.asset))) {
    addBatch(asset);
  }

  return { root, createInstance, lowerTile, destroy };

  /** Existing assets reuse their batch; a new building type starts its own batch. */
  function createInstance(tile: NeighborhoodTile) {
    const batch = batches.get(tile.asset) ?? addBatch(tile.asset);
    return batch.createInstance(tile);
  }

  function addBatch(asset: NeighborhoodTile['asset']) {
    const tiles = layout.filter((tile) => tile.asset === asset);
    const batch = createCityModelBatch({
      asset,
      tiles,
      capacity: tiles.length + countReservedInstances(asset),
      palette,
    });
    batches.set(asset, batch);
    root.add(...batch.meshes);

    // Only original terrain needs lowering when an entrance replaces it.
    tiles.forEach((tile, index) => {
      cells.set(
        `${tile.x},${tile.z}`,
        batch.meshes.map((mesh) => ({ mesh, index })),
      );
    });
    return batch;
  }

  /** Keep a backing surface below the replacement, without coplanar faces or holes. */
  function lowerTile(x: number, z: number): void {
    const key = `${x},${z}`;
    if (loweredCells.has(key)) {
      return;
    }
    loweredCells.add(key);
    const transform = new Matrix4();
    const lower = new Matrix4().makeTranslation(0, -0.08, 0);
    for (const { mesh, index } of cells.get(key) ?? []) {
      mesh.getMatrixAt(index, transform);
      transform.premultiply(lower);
      mesh.setMatrixAt(index, transform);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }

  function destroy(): void {
    root.removeFromParent();
    for (const batch of batches.values()) {
      batch.destroy();
    }
    batches.clear();
    root.clear();
  }
}

/** Reserve exactly the future houses, plot bases, and entrance tiles. */
function countReservedInstances(asset: NeighborhoodTile['asset']): number {
  if (asset === models['city/pavement']) {
    const entranceTiles = buildingPlots.reduce(
      (count, plot) => count + Math.max(0, road.streetZ - plot.z - 1),
      0,
    );
    return buildingPlots.length + entranceTiles;
  }
  return buildings.filter((building) => building.asset === asset).length;
}
