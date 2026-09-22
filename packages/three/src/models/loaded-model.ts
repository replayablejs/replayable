import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

import type { ModelResources } from '#types/models.js';

/**
 * One parsed asset stored in the runtime cache. Its identity distinguishes loaded
 * Three.js assets from source metadata without revalidating Three.js internals.
 * Shared resource lifetime remains application-owned.
 */
export class LoadedModel {
  /** Disposal is final because runtime bundles cannot reload cached assets. */
  disposed = false;
  readonly gltf: GLTF;
  readonly resources: ModelResources;

  constructor(gltf: GLTF, resources: ModelResources) {
    this.gltf = gltf;
    this.resources = resources;
  }
}
