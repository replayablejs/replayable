import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { registerModelDecoder } from '#integrations/model-decoders.js';
import type { ThreeIntegration } from '#types/integrations.js';

/** Creates the optional Meshopt capability using Three.js's bundled decoder. */
export function createMeshoptIntegration(): ThreeIntegration {
  return {
    setup: setupMeshoptDecoder,
  };
}

/** Registers the shared decoder; GLTFLoader waits for its initialization before decoding. */
function setupMeshoptDecoder(): () => void {
  return registerModelDecoder('meshopt', configureLoader, releaseDecoder);
}

/** Every model loader uses the same decoder rather than initializing its own. */
function configureLoader(loader: GLTFLoader): void {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

/** Unregistering removes the capability; this shared decoder has no disposal API. */
function releaseDecoder(): void {
  // No worker pool is enabled, so there are no integration-owned workers to stop.
}
