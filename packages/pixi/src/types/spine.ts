import type { DisplayObjectOptions } from '#types/factories.js';

/** Options for creating a Spine display object from a loaded Replayable asset. */
export interface CreateSpineOptions extends DisplayObjectOptions {
  /** Default crossfade duration, in seconds, between animations. */
  readonly defaultMix?: number;
  /** Generated Spine registry value identifying the loaded skeleton. */
  readonly skeleton: string;
  /** Playback multiplier applied to the skeleton's animation state. */
  readonly speed?: number;
}
/** Loaded JSON input accepted by Spine's JSON skeleton reader. */
export interface LoadedJsonSkeleton {
  readonly data: object;
  readonly format: 'json';
}

/** Decoded bytes accepted by Spine's binary skeleton reader. */
export interface LoadedBinarySkeleton {
  readonly data: Uint8Array;
  readonly format: 'skel';
}

/** Internal discriminated input selecting Spine's corresponding parser. */
export type LoadedSkeleton = LoadedBinarySkeleton | LoadedJsonSkeleton;
