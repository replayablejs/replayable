import { playable } from '@replayablejs/runtime';

import type { CreateModelOptions, ReplayableModel } from '#types/models.js';

import { createModelInstance } from './create-model-instance.js';
import { LoadedModel } from './loaded-model.js';
import { disposeModelResources } from './model-resources.js';

/** Clones a runtime-cached model. The playable owns the instance and its animation timing. */
export function createModel({ asset }: CreateModelOptions): ReplayableModel {
  const model = resolveModel(asset);
  if (model.disposed) {
    throw new Error(`Model "${asset}" has been disposed.`);
  }
  return createModelInstance(model.gltf);
}

/**
 * Releases shared asset resources after the playable has destroyed all instances.
 * This does not unload or reset runtime bundles. The disposed template stays in
 * the cache and cannot create new instances. Repeated disposal is safe.
 */
export function disposeModelAsset({ asset }: CreateModelOptions): void {
  const model = resolveModel(asset);
  if (model.disposed) {
    return;
  }
  model.disposed = true;
  disposeModelResources(model.resources);
}

/** Rejects unloaded or pass-through entries before using Three-specific cache data. */
function resolveModel(id: string): LoadedModel {
  const model = playable.loader.cache.models?.[id];
  if (!(model instanceof LoadedModel)) {
    throw new Error(
      `Model "${id}" has not been loaded. Await playable.ready() or its bundle load.`,
    );
  }
  return model;
}
