import { InstancedMesh, Matrix4, Object3D } from 'three';

import type { TileInstancesConfig } from '../types/city-instances';
import type { NeighborhoodTile } from './neighborhood-layout';

const quarterTurn = Math.PI / 2;

/**
 * Repeats one model mesh across its assigned grid cells using GPU instancing.
 * Geometry and material stay shared with the loaded model. The caller owns the
 * returned InstancedMesh and releases its instance buffer with dispose().
 */
export function createTileInstances({
  source,
  tiles,
  capacity,
}: TileInstancesConfig): InstancedMesh {
  // 1. Reserve room for starting tiles and future placements of this same mesh.
  const instances = new InstancedMesh(source.geometry, source.material, capacity);
  instances.count = tiles.length;
  instances.visible = tiles.length > 0;
  instances.castShadow = true;
  instances.receiveShadow = true;

  // 2. Give every copy its position and rotation in the neighborhood.
  positionTiles(instances, source.matrixWorld, tiles);

  // 3. Request a GPU upload and calculate bounds covering all copies.
  // Three.js uses these bounds to skip scenery outside the camera view.
  instances.instanceMatrix.needsUpdate = true;
  instances.computeBoundingSphere();
  return instances;
}

/**
 * Combines each tile's placement with the mesh's original transform inside its model.
 * The caller must update the source model's world matrices before using this helper.
 */
function positionTiles(
  instances: InstancedMesh,
  sourceTransform: Matrix4,
  tiles: readonly NeighborhoodTile[],
): void {
  // Reuse working objects instead of allocating new ones for every tile.
  const placement = new Object3D();
  const finalTransform = new Matrix4();

  for (const [index, tile] of tiles.entries()) {
    placement.position.set(tile.x, 0, tile.z);
    placement.rotation.y = (tile.rotation ?? 0) * quarterTurn;
    placement.updateMatrix();

    // Multiplication order matters: preserve the model's internal offset/scale,
    // then move and rotate that model into its grid cell.
    finalTransform.multiplyMatrices(placement.matrix, sourceTransform);
    instances.setMatrixAt(index, finalTransform);
  }
}
