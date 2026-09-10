import { assertUniqueRuntimeAssetIds } from '#pipeline/asset-identity.js';
import { settleAssetTasks } from '#pipeline/settle-asset-tasks.js';
import type { ProcessedAsset } from '#types/processed-assets.js';
import type { ResolvedAsset } from '#types/resolved-assets.js';

import { processAtlas } from './categories/atlas.js';
import { processFont } from './categories/font.js';
import { processImage } from './categories/image.js';
import { processLocale } from './categories/locale.js';
import { processShader } from './categories/shader.js';
import { processSound } from './categories/sound.js';
import { processSpine } from './categories/spine.js';

/**
 * Processes every fully resolved asset without category-specific scheduling.
 *
 * Every returned record represents one final runtime entry. Processor results
 * remain arrays because one source atlas may produce several logical sheets;
 * singleton categories return a one-element array through the same dispatcher.
 * The completed collection is guaranteed to contain unique runtime IDs.
 */
export async function processAssets(assets: readonly ResolvedAsset[]): Promise<ProcessedAsset[]> {
  // Assets are independent after resolution, so process them concurrently.
  // Preserve input order and wait for every writer before reporting failures,
  // so staging cleanup never races an encoder that is still running.
  const processedBatches = await settleAssetTasks(assets.map(processAsset));

  // Each input produces a batch because an atlas may expand into several
  // runtime sheets. Singleton processors return a one-entry batch.
  const processedAssets = processedBatches.flat();

  // Runtime IDs can only be validated after expansion because generated atlas
  // sheet names do not exist in the resolved input model.
  assertUniqueRuntimeAssetIds(processedAssets);

  return processedAssets;
}

/** Delegates one resolved asset to the processor for its discriminated category. */
function processAsset(asset: ResolvedAsset): Promise<ProcessedAsset[]> {
  const category = asset.category;

  switch (category) {
    case 'atlases':
      return processAtlas(asset);
    case 'fonts':
      return processFont(asset);
    case 'locales':
      return processLocale(asset);
    case 'shaders':
      return processShader(asset);
    case 'sounds':
      return processSound(asset);
    case 'spines':
      return processSpine(asset);
    case 'sprites':
    case 'textures':
      return processImage(asset);
    default:
      return unsupportedCategory(category);
  }
}

/** Enforces exhaustive category dispatch when the ResolvedAsset union changes. */
function unsupportedCategory(category: never): never {
  throw new Error(`Unsupported resolved asset category: ${String(category)}.`);
}
