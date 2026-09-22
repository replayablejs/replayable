import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Optional capability installed before readiness and released with the renderer. */
export interface ThreeIntegration {
  setup(): () => void;
}

/** Geometry codecs emitted by the model asset pipeline. */
export type ModelCodec = 'meshopt' | 'draco';

/** Internal registration: each load holds a lease until GLTF parsing finishes. */
export interface ModelDecoder {
  /** Configures one loader and returns a callback to signal that parsing finished. */
  acquire(loader: GLTFLoader): () => void;
  /** Stops accepting loads and releases resources when existing loads finish. */
  destroy(): void;
}

/** Draco's decoder files default to the glTF decoder supplied by the Three.js peer. */
export interface DracoIntegrationOptions {
  /** Override decoder URLs for custom hosting or inline data URLs. */
  readonly decoderPath?: string | { js: string; wasm: string };
  /** Maximum shared decoder workers. Defaults to 4, matching Three.js. */
  readonly workerLimit?: number;
}
