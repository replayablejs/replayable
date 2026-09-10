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
      // Vite 8's dependency resolver skips imports beginning with '#'. Forward
      // the same string aliases to Rolldown so prebundling selects the same
      // runtime bindings as the development module graph.
      optimizeDeps: {
        rolldownOptions: {
          resolve: {
            alias: Array.isArray(entryConfig.resolve?.alias)
              ? Object.fromEntries(
                  entryConfig.resolve.alias.flatMap(({ find, replacement }) =>
                    typeof find === 'string' ? [[find, replacement]] : [],
                  ),
                )
              : entryConfig.resolve?.alias,
          },
        },
      },
    }),
  );
}
