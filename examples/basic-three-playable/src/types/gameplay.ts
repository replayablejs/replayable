import type { PerspectiveCamera } from 'three';

import type { createBuildingPath } from '../features/building/create-building-path';
import type { createNeighborhood } from '../scene/create-neighborhood';
import type { CityModelInstance } from './city-instances';

export interface GameplayConfig {
  readonly camera: PerspectiveCamera;
  readonly neighborhood: ReturnType<typeof createNeighborhood>;
}

export interface PlacedHome {
  readonly model: CityModelInstance;
  readonly path: ReturnType<typeof createBuildingPath>;
}

/** Camera and callback used by the canvas placement input. */
export interface PlotInputConfig {
  readonly camera: PerspectiveCamera;
  readonly onPlotTap: (index: number) => void;
}
