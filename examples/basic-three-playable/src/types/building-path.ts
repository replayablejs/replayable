import type { createNeighborhood } from '../scene/create-neighborhood';

/** Placement and the shared city batches used by a building entrance. */
export interface BuildingPathConfig {
  readonly plot: { readonly x: number; readonly z: number };
  readonly neighborhood: ReturnType<typeof createNeighborhood>;
}
