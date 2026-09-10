import { assetConfigSchema } from '#config/schema.js';
import { emitBuildOutputs } from '#emitters/emit-build-outputs.js';
import { groupAssets } from '#pipeline/asset-groups.js';
import { createBuildResult } from '#pipeline/build-result.js';
import { createBuildContext } from '#pipeline/context.js';
import { createBuildStaging } from '#pipeline/create-build-staging.js';
import { validateOutputClaims } from '#pipeline/validate-output-claims.js';
import { processAssets } from '#processors/process-assets.js';
import { resolveAssets } from '#resolvers/resolve-assets.js';
import type { BuildAssetsResult } from '#types/build.js';
import type { AssetConfigInput } from '#types/config.js';

/**
 * Builds every configured asset and generates the runtime assets module.
 *
 * @param input - Author-written or previously normalized asset configuration.
 * @param workingDirectory - Project root used to resolve every configured path.
 * Defaults to the current process directory.
 * @returns Logical asset and physical file counts, populated bundles, and the
 * absolute output directory.
 * @throws When configuration is invalid, configured paths are unsafe, or an
 * asset cannot be resolved, processed, or emitted.
 *
 * @example
 *
 * ```ts
 * const result = await buildAssets(config, process.cwd());
 *
 * console.log(result.emittedAssets);
 * console.log(result.emittedFiles);
 * console.log(result.outputDirectory);
 * ```
 */
export async function buildAssets(
  input: AssetConfigInput,
  workingDirectory = process.cwd(),
): Promise<BuildAssetsResult> {
  const config = assetConfigSchema.parse(input);
  const context = createBuildContext(config, workingDirectory);

  const staging = await createBuildStaging(context, workingDirectory);

  try {
    const resolved = await resolveAssets(config, staging.context);
    validateOutputClaims(resolved);

    const processed = await processAssets(resolved);
    const assetGroups = groupAssets(processed);

    await emitBuildOutputs(staging.context, assetGroups);
    await staging.commit();

    return createBuildResult(context, assetGroups);
  } finally {
    await staging.dispose();
  }
}
