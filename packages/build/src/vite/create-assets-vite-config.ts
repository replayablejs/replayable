import type { InlineConfig } from 'vite';

import type { PlayableViteContext } from '#types/vite.js';

import { createGeneratedAssetsPlugin } from './plugins/generated-assets.js';

/** Creates Vite configuration for the generated assets registration only. */
export function createAssetsViteConfig(options: PlayableViteContext): InlineConfig {
  return {
    resolve: {
      alias: {
        '#generated-assets': options.assetsModule,
      },
    },
    plugins: [
      createGeneratedAssetsPlugin({
        assetsModule: options.assetsModule,
        mode: options.profile.assetMode,
      }),
    ],
  };
}
