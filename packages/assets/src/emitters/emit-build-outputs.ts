import type { AssetGroups } from '#types/asset-groups.js';
import type { BuildContext } from '#types/context.js';

import { emitAssetsModule } from './emit-assets-module.js';
import { emitRegistries } from './emit-registries.js';

/**
 * Coordinates every source-code output produced from processed assets.
 *
 * The runtime assets module is mandatory and is always emitted first. Developer
 * registries are optional: when registry configuration is absent from the
 * normalized build context, there is no registry work to perform.
 *
 * For example, one build may write:
 *
 * ```text
 * src/assets/assets.gen.ts
 * src/assets/registries/index.ts
 * src/assets/registries/atlases.ts
 * src/assets/registries/fonts.ts
 * src/assets/registries/locales.ts
 * src/assets/registries/shaders.ts
 * src/assets/registries/sounds.ts
 * src/assets/registries/spines.ts
 * src/assets/registries/sprites.ts
 * src/assets/registries/textures.ts
 * ```
 *
 * `BuildContext` already contains absolute, validated output paths, while
 * `AssetGroups` contains prepared bundle and bundle-independent category views.
 * This function therefore performs no processing, grouping, or sorting. Rendering and
 * filesystem writes remain owned by the specialized emitters. Keeping the
 * calls sequential also makes the output order and any partial failure
 * straightforward to follow.
 *
 * @param context - Validated absolute paths controlling generated outputs.
 * @param assetGroups - Processed assets organized for source-code emission.
 */
export async function emitBuildOutputs(
  context: BuildContext,
  assetGroups: AssetGroups,
): Promise<void> {
  await emitAssetsModule(context.assetsFile, assetGroups);

  if (context.registriesDirectory !== undefined) {
    await emitRegistries(context.registriesDirectory, assetGroups);
  }
}
