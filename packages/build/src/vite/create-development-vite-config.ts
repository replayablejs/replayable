import { mergeConfig, type InlineConfig } from 'vite';

import type { DevelopmentViteConfigOptions } from '#types/vite.js';

import { createBaseViteConfig } from './create-base-vite-config.js';

/** Combines the four production entry configurations into one HMR module graph. */
export function createDevelopmentViteConfig(options: DevelopmentViteConfigOptions): InlineConfig {
  const { application, assets, config, host } = options.entries;
  const entryConfig = [host, config, assets, application].reduce<InlineConfig>(
    (current, entry) => mergeConfig(current, entry.viteConfig),
    {},
  );

  return mergeConfig(
    createBaseViteConfig(options.projectRoot),
    mergeConfig(entryConfig, {
      plugins: [...(options.plugins ?? [])],
    }),
  );
}
