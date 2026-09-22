import { models } from '../assets/registries/models';

/** Tile coordinates use Kenney's one-unit grid; rotation counts quarter turns. */
export interface NeighborhoodTile {
  readonly asset: (typeof models)[keyof typeof models];
  readonly x: number;
  readonly z: number;
  readonly rotation?: number;
}

/** The open foreground keeps all three future placement targets visible. */
export const buildingPlots = [
  { x: -2, z: -2 },
  { x: 0, z: -3 },
  { x: 2, z: -1 },
] as const;

/**
 * Covers the fixed camera at supported portrait/landscape ratios, plus about two
 * tiles of margin for models and shadows. The angled view sees farther behind
 * the plots, so the bounds extend farther toward negative x/z than positive x/z.
 * Recheck these bounds when changing camera framing or supported aspect ratios.
 */
export const terrain = {
  minX: -16,
  maxX: 8,
  minZ: -18,
  maxZ: 6,
  gardenRadius: 9,
} as const;

/** One lane runs along z = 0 and turns toward negative z at x = -5. */
export const road = { bendX: -5, streetZ: 0 } as const;

/** A few homes face the street; the fountain anchors a small pedestrian garden. */
export const landmarks: readonly NeighborhoodTile[] = [
  // Existing homes face the road, with the middle house staggered from the plots.
  { asset: models['city/building-small-a'], x: -3, z: 1, rotation: 2 },
  { asset: models['city/building-small-b'], x: -1, z: 2, rotation: 2 },
  { asset: models['city/building-small-a'], x: 3, z: 1, rotation: 2 },
  { asset: models['city/building-small-a'], x: 7, z: 1, rotation: 2 },
  // Spread two homes along the upper road instead of crowding the lower-right block.
  // They sit on opposite sides, staggered by two cells, with entrances toward the road.
  { asset: models['city/building-small-a'], x: -6, z: -8, rotation: 1 },
  { asset: models['city/building-small-b'], x: -4, z: -6, rotation: 3 },
  // Fountain plaza in the clearing across the perpendicular road from the houses.
  // The entrance approaches from positive x, connecting directly to the road at x = -5.
  { asset: models['city/pavement-fountain'], x: -7, z: -4 },
  { asset: models['city/pavement'], x: -6, z: -4 },
  { asset: models['city/pavement'], x: -7, z: -3 },
  { asset: models['city/pavement'], x: -7, z: -5 },
  // Keep the plaza's immediate surroundings clear of procedural trees.
  { asset: models['city/grass'], x: -8, z: -4 },
  { asset: models['city/grass'], x: -6, z: -3 },
  { asset: models['city/grass'], x: -6, z: -5 },
  // Entrance for the existing set-back house.
  { asset: models['city/pavement'], x: -1, z: 1 },
  // Keep future entrance paths grassy until their buildings are placed.
  { asset: models['city/grass'], x: 0, z: -1 },
  { asset: models['city/grass'], x: 0, z: -2 },
  { asset: models['city/grass'], x: -2, z: -1 },
];

/** Uneven groves leave clearings between them instead of repeating tree rows. */
export const groves = [
  { x: -3, z: -4, radius: 1.7 },
  { x: 2, z: -5, radius: 1.8 },
  { x: -5, z: 4, radius: 1.5 },
  { x: 5, z: 4, radius: 1.6 },
  { x: 0, z: 7, radius: 1.7 },
];
