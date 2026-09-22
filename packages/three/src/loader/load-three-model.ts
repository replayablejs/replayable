import type { AssetLoadContext } from '@replayablejs/runtime';
import { LoadingManager } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { acquireModelDecoder } from '#integrations/model-decoders.js';
import { LoadedModel } from '#models/loaded-model.js';
import { disposeModelResources, collectModelResources } from '#models/model-resources.js';

/**
 * Loads one generated model and returns its resources for the runtime cache.
 *
 * Keep this boundary responsible for codec validation and asset-specific errors.
 * Parsing and dependency validation live together below, so only complete models
 * escape to the caller. The original error remains available through `cause`.
 */
export async function loadThreeModel({
  id,
  source,
}: AssetLoadContext<'models'>): Promise<LoadedModel> {
  try {
    return await loadCompleteModel(source);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Cannot load model "${id}": ${message}`, { cause });
  }
}

/**
 * Parses a URL or inline data URI and rejects incomplete dependency loads.
 *
 * Each model gets its own LoadingManager so concurrent loads cannot mix failures.
 * GLTFLoader may resolve after an image fails, leaving a model with missing textures.
 * Record manager errors and check them after parsing, before transferring ownership.
 *
 * Collect resources even for an incomplete result: it may already own geometry,
 * materials, and decoded images. Dispose those resources before rejecting it.
 * A successful return transfers cleanup responsibility to the playable.
 */
async function loadCompleteModel({
  src,
  compression,
}: AssetLoadContext<'models'>['source']): Promise<LoadedModel> {
  const failedDependencies: string[] = [];
  const manager = new LoadingManager();
  manager.onError = (url) => {
    failedDependencies.push(url);
  };

  const loader = new GLTFLoader(manager);
  const releaseDecoder = acquireModelDecoder(compression, loader);
  try {
    const gltf = await loader.loadAsync(src);
    const resources = collectModelResources(gltf);

    if (failedDependencies.length > 0) {
      disposeModelResources(resources);
      throw new Error(`Failed to load model dependencies: ${failedDependencies.join(', ')}`);
    }
    return new LoadedModel(gltf, resources);
  } finally {
    releaseDecoder();
  }
}
