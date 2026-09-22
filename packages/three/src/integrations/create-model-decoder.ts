import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import type { ModelDecoder } from '#types/integrations.js';

/**
 * Keeps a shared decoder alive while models are loading.
 * Each pending load has a finish callback. Destroy blocks new loads immediately,
 * but only disposes the decoder once every pending load has finished.
 */
export function createModelDecoder(
  configure: (loader: GLTFLoader) => void,
  dispose: () => void,
): ModelDecoder {
  const pendingLoads = new Set<() => void>();
  let closed = false;

  return {
    acquire(loader): () => void {
      if (closed) {
        throw new Error('Model decoder has been closed.');
      }

      // Failed configuration must not leave a pending load behind.
      configure(loader);
      pendingLoads.add(finishLoad);
      return finishLoad;

      /** The loader calls this in finally, on either success or failure. */
      function finishLoad(): void {
        // Deleting a callback twice returns false, preventing duplicate disposal.
        if (!pendingLoads.delete(finishLoad)) {
          return;
        }
        if (closed && pendingLoads.size === 0) {
          dispose();
        }
      }
    },

    destroy(): void {
      if (closed) {
        return;
      }
      closed = true;

      // Otherwise the last pending finishLoad callback will dispose the decoder.
      if (pendingLoads.size === 0) {
        dispose();
      }
    },
  };
}
