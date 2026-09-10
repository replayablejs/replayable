import { buildAssets } from '@replayablejs/assets';
import type { PlayableVariant } from '@replayablejs/config';

import { emitPlayableHtml } from '#html/emit-playable-html.js';
import { createBuildContext } from '#pipeline/create-build-context.js';
import type { BuildVariantOptions, BuildVariantResult } from '#types/build.js';

import { bundleVariant } from './bundle-variant.js';

/**
 * Produces one runnable playable from a concrete configuration variant.
 *
 * @param variant - Fully resolved version, network, and language combination.
 * @param options - Explicit project root and variant output directory.
 */
export async function buildVariant(
  variant: PlayableVariant,
  options: BuildVariantOptions,
): Promise<BuildVariantResult> {
  const context = createBuildContext(variant, options);
  const assets = await buildAssets(context.variant.assets, context.projectRoot);

  const bundle = await bundleVariant(context);

  await emitPlayableHtml(context, bundle);

  return {
    assets,
    htmlFile: context.htmlFile,
    outputDirectory: context.outputDirectory,
    variantId: context.variant.id,
  };
}
