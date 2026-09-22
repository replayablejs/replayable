import type { InstancedMesh, Mesh, Object3D, Texture } from 'three';

import type { NeighborhoodTile } from '../scene/neighborhood-layout';

/** An off-scene hierarchy whose transforms are rendered by shared instance batches. */
export interface CityModelInstance {
  readonly root: Object3D;
  /** Upload changes to position, building scale, or root visibility. */
  update(): void;
  /** Hide this instance and release its hierarchy; the neighborhood owns GPU buffers. */
  destroy(): void;
}

export interface CityModelBatchConfig {
  readonly asset: NeighborhoodTile['asset'];
  readonly tiles: readonly NeighborhoodTile[];
  readonly capacity: number;
  readonly palette: Texture;
}

/** Source mesh, starting placements, and total reserved GPU capacity. */
export interface TileInstancesConfig {
  readonly source: Mesh;
  readonly tiles: readonly NeighborhoodTile[];
  readonly capacity: number;
}

/** One placement occupies the same slot in every mesh batch of its model. */
export interface CityModelInstanceConfig {
  readonly tile: NeighborhoodTile;
  readonly slot: number;
  readonly meshes: readonly InstancedMesh[];
}
