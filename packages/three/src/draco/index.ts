import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/addons/loaders/DRACOLoader.js';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { registerModelDecoder } from '#integrations/model-decoders.js';
import type { DracoIntegrationOptions, ThreeIntegration } from '#types/integrations.js';

export type { DracoIntegrationOptions } from '#types/integrations.js';

/** Creates the optional Draco capability. Decoder resources are acquired during setup. */
export function createDracoIntegration(options: DracoIntegrationOptions = {}): ThreeIntegration {
  return {
    setup: () => setupDracoDecoder(options),
  };
}

/** Configures one decoder shared by every Draco model loaded during this registration. */
function setupDracoDecoder({
  decoderPath = DRACO_GLTF_CONFIG,
  workerLimit = 4,
}: DracoIntegrationOptions): () => void {
  if (!Number.isInteger(workerLimit) || workerLimit < 1) {
    throw new Error('Draco workerLimit must be a positive integer.');
  }

  const decoder = new DRACOLoader();
  const configureLoader = (loader: GLTFLoader): void => {
    loader.setDRACOLoader(decoder);
  };
  const disposeDecoder = (): void => {
    decoder.dispose();
  };

  try {
    // Three.js supplies the default files. Workers start lazily on the first load.
    decoder.setDecoderPath(decoderPath);
    decoder.setWorkerLimit(workerLimit);

    // Unregister blocks new loads, then disposes workers after active loads finish.
    return registerModelDecoder('draco', configureLoader, disposeDecoder);
  } catch (error) {
    // Setup failed before ownership transferred to the decoder registration.
    disposeDecoder();
    throw error;
  }
}
