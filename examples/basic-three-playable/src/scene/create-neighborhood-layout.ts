import { models } from '../assets/registries/models';
import { buildingPlots, groves, landmarks, road, terrain } from './neighborhood-layout';
import type { NeighborhoodTile } from './neighborhood-layout';

/** Builds the neighborhood in layers. Each new tile replaces the previous tile at that cell. */
export function createNeighborhoodLayout(): NeighborhoodTile[] {
  const tiles = new Map<string, NeighborhoodTile>();

  // 1. Cover the whole area with grass and scattered trees.
  for (let z = terrain.minZ; z <= terrain.maxZ; z++) {
    for (let x = terrain.minX; x <= terrain.maxX; x++) {
      place(createGreeneryTile(x, z));
    }
  }

  // 2. Leave the three playable cells to createBuildingPlots, which owns their pavement.
  for (const plot of buildingPlots) {
    tiles.delete(`${plot.x},${plot.z}`);
  }

  // 3. Lay the horizontal street, its vertical approach, and the connecting bend.
  for (let x = road.bendX + 1; x <= terrain.maxX; x++) {
    place({ asset: models['city/road-straight'], x, z: road.streetZ, rotation: 1 });
  }
  for (let z = terrain.minZ; z < road.streetZ; z++) {
    place({ asset: models['city/road-straight'], x: road.bendX, z });
  }
  place({ asset: models['city/road-corner'], x: road.bendX, z: road.streetZ, rotation: 2 });

  // 4. Add the hand-placed houses, fountain, and paths from the layout data.
  for (const landmark of landmarks) {
    place(landmark);
  }

  return [...tiles.values()];

  // Replacing a cell avoids drawing grass underneath a road or building.
  function place(tile: NeighborhoodTile): void {
    tiles.set(`${tile.x},${tile.z}`, tile);
  }
}

/** Sparse trees fill the groves and distant terrain; the remaining cells are meadow. */
function createGreeneryTile(x: number, z: number): NeighborhoodTile {
  const insideGrove = groves.some((grove) => {
    const distance = Math.hypot(x - grove.x, z - grove.z);
    return distance < grove.radius;
  });
  const outsideGarden = Math.hypot(x, z) > terrain.gardenRadius;
  const canPlaceTrees = insideGrove || outsideGarden;
  // Keep roughly 30% of eligible cells wooded so the groves still have gaps.
  const hasTrees = canPlaceTrees && coordinateVariation(x, z) > 0.7;

  return {
    asset: hasTrees ? models['city/grass-trees'] : models['city/grass'],
    x,
    z,
    // A different coordinate sample varies orientation independently of tree placement.
    rotation: Math.floor(coordinateVariation(x + 5, z + 7) * 4),
  };
}

/**
 * Produces a repeatable value from 0 to 1 for each cell. Fixed mixing constants
 * break up grid patterns while keeping the same scenery on every reload.
 */
function coordinateVariation(x: number, z: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return value - Math.floor(value);
}
