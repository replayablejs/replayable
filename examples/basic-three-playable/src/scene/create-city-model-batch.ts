import { createModel } from '@replayablejs/three';
import { DynamicDrawUsage, Matrix4, Mesh } from 'three';
import type { InstancedMesh, Object3D } from 'three';

import type {
  CityModelBatchConfig,
  CityModelInstance,
  CityModelInstanceConfig,
} from '../types/city-instances';
import { applyCityPalette } from './apply-city-palette';
import { createTileInstances } from './create-tile-instances';
import type { NeighborhoodTile } from './neighborhood-layout';

/**
 * Owns one GPU batch for each mesh in a city model.
 * Starting scenery fills the first slots; player placements use the reserved slots.
 */
export function createCityModelBatch({ asset, tiles, capacity, palette }: CityModelBatchConfig) {
  const template = createModel({ asset });
  applyCityPalette(template.root, palette);
  template.root.updateMatrixWorld(true);

  const meshes: InstancedMesh[] = [];
  for (const source of collectMeshes(template.root)) {
    const mesh = createTileInstances({ source, tiles, capacity });
    if (capacity > tiles.length) {
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    }
    meshes.push(mesh);
  }

  let usedSlots = tiles.length;
  return { meshes, createInstance, destroy };

  /** Give a placement one slot across all meshes, such as ground and building. */
  function createInstance(tile: NeighborhoodTile): CityModelInstance {
    if (usedSlots >= capacity) {
      throw new Error(`No reserved city instances remain for ${asset}.`);
    }

    const slot = usedSlots;
    usedSlots += 1;
    for (const mesh of meshes) {
      mesh.count = usedSlots;
      mesh.visible = true;
    }

    return createCityModelInstance({ tile, slot, meshes });
  }

  /** Called after gameplay stops and releases its individual placements. */
  function destroy(): void {
    for (const mesh of meshes) {
      mesh.removeFromParent();
      mesh.dispose();
    }
    template.destroy();
  }
}

/**
 * Keeps an editable model hierarchy outside the rendered scene.
 * Only its transforms are copied to the GPU; the clone adds no separate draw calls.
 */
function createCityModelInstance({
  tile,
  slot,
  meshes,
}: CityModelInstanceConfig): CityModelInstance {
  const model = createModel({ asset: tile.asset });
  const sources = collectMeshes(model.root);
  const hiddenTransform = new Matrix4().makeScale(0, 0, 0);

  model.root.position.set(tile.x, 0, tile.z);
  model.root.rotation.y = ((tile.rotation ?? 0) * Math.PI) / 2;
  update();

  return { root: model.root, update, destroy };

  /** Copy animated transforms, including the GLB's separate building pivot. */
  function update(): void {
    model.root.updateMatrixWorld(true);

    // Template and clone have identical mesh order, so each source has one batch.
    for (const [meshIndex, source] of sources.entries()) {
      const batch = meshes[meshIndex]!;
      const transform = model.root.visible ? source.matrixWorld : hiddenTransform;
      batch.setMatrixAt(slot, transform);
      batch.instanceMatrix.needsUpdate = true;

      // Include new or moving placements in the bounds used for camera culling.
      batch.computeBoundingSphere();
    }
  }

  /** Hide the reserved slot before releasing the clone; shared buffers stay alive. */
  function destroy(): void {
    model.root.visible = false;
    update();
    model.destroy();
  }
}

/** Collect renderable parts in scene order, excluding groups and pivot nodes. */
function collectMeshes(root: Object3D): Mesh[] {
  const meshes: Mesh[] = [];
  root.traverse((object) => {
    if (object instanceof Mesh) {
      meshes.push(object);
    }
  });
  return meshes;
}
