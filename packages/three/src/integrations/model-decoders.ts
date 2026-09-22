import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import type { ModelCodec, ModelDecoder } from '#types/integrations.js';

import { createModelDecoder } from './create-model-decoder.js';

// The runtime has one exclusive models handler. Its optional decoder registrations
// share that lifetime, while each GLTFLoader keeps its own dependency manager.
const decoders = new Map<ModelCodec, ModelDecoder>();

/**
 * Registers one shared decoder and returns its unregister operation.
 * Unregister immediately prevents new loads. Decoder disposal waits for existing
 * loads, because terminating Draco workers mid-parse would leave promises pending.
 */
export function registerModelDecoder(
  codec: ModelCodec,
  configure: (loader: GLTFLoader) => void,
  dispose: () => void,
): () => void {
  if (decoders.has(codec)) {
    throw new Error(`A ${codec} model decoder is already registered.`);
  }

  const decoder = createModelDecoder(configure, dispose);
  decoders.set(codec, decoder);

  if (decoders.size === 2) {
    console.warn(
      '[replayable/three] Both Meshopt and Draco integrations are registered. Prefer one codec to avoid shipping two decoders; keep both only when your models require both.',
    );
  }

  return unregister;

  /** Remove this registration without affecting a newer decoder for the same codec. */
  function unregister(): void {
    if (decoders.get(codec) !== decoder) {
      return;
    }
    decoders.delete(codec);
    decoder.destroy();
  }
}

/** Configures a loader for its asset's codec and returns the load's release callback. */
export function acquireModelDecoder(
  compression: ModelCodec | 'none',
  loader: GLTFLoader,
): () => void {
  if (compression === 'none') {
    return () => {};
  }
  const decoder = decoders.get(compression);
  if (decoder === undefined) {
    const integration =
      compression === 'meshopt' ? 'createMeshoptIntegration' : 'createDracoIntegration';
    throw new Error(
      `Requires ${integration}() for ${compression} compression; decoder integration is not registered.`,
    );
  }
  return decoder.acquire(loader);
}
