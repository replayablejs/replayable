import type { AssetsModuleContext, RegistryObject } from '#types/emission.js';
import type { ProcessedModelAsset } from '#types/processed-assets.js';

import { registerImport } from '../utils/assets-module.js';
import { renderPropertyKey } from '../utils/object-literal.js';
import { createIdentityRegistry } from '../utils/registry.js';

/** Ordinary binary imports use the same inline/resource policy as other assets. */
export function renderModelEntry(asset: ProcessedModelAsset, context: AssetsModuleContext): string {
  const src = registerImport(context, 'model', asset.file.path);
  return `      ${renderPropertyKey(asset.id)}: { src: ${src}, compression: ${JSON.stringify(asset.runtime.compression)} },`;
}

export function renderModelRegistry(assets: readonly ProcessedModelAsset[]): RegistryObject {
  return createIdentityRegistry(assets.map((asset) => asset.id));
}
