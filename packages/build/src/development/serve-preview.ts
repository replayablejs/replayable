import { buildAssets } from '@replayablejs/assets';
import { createVariants, defineConfig, type ReplayableConfigInput } from '@replayablejs/config';

import { createDevelopmentContext } from '#pipeline/create-development-context.js';
import type { ServePreviewOptions, ServePreviewResult } from '#types/build.js';

import { createDevelopmentServer } from './create-development-server.js';
import { selectDevelopmentVariant } from './select-development-variant.js';

/** Builds one preview variant's assets and starts its local Vite server. */
export async function servePreview(
  config: ReplayableConfigInput,
  options: ServePreviewOptions,
): Promise<ServePreviewResult> {
  const validatedConfig = defineConfig(config);
  const variants = createVariants(validatedConfig);
  const variant = selectDevelopmentVariant(variants, options);
  const context = createDevelopmentContext(variant, options);

  await buildAssets(context.variant.assets, context.projectRoot);

  const server = await createDevelopmentServer(context);
  const resolvedUrls = server.resolvedUrls;

  return {
    close: () => server.close(),
    localUrls: resolvedUrls?.local ?? [],
    networkUrls: resolvedUrls?.network ?? [],
    variantId: context.variant.id,
  };
}
