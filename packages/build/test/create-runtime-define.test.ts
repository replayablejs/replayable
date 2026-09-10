import { createVariants, defineConfig } from '@replayablejs/config';
import { describe, expect, it } from 'vitest';

import { resolvePlayableProfile } from '../src/networks/network-profiles.js';
import { createRuntimeDefine } from '../src/runtime/create-runtime-define.js';

describe('runtime development configuration', () => {
  it.each([false, true, { fps: false }, { display: 'compact' as const }])(
    'injects normalized stats %j',
    (stats) => {
      const config = defineConfig({
        assets: {
          sourceDir: 'assets',
          outDir: 'src/assets/resources',
          assets: {},
          emit: { assets: 'src/assets/assets.ts' },
        },
        devtools: { stats },
        localization: { fallback: 'en', languages: ['en'] },
        name: 'runtime-config',
        screen: {
          orientations: {
            portrait: { enabled: true, width: 700, height: 1400, ratio: { min: 0.46, max: 0.76 } },
            landscape: { enabled: true, width: 1400, height: 700, ratio: { min: 1.32, max: 2.18 } },
          },
          resolution: {
            pixelRatio: { min: 1, max: 2 },
            renderScale: { minimal: 0.55, reduced: 0.65, balanced: 0.85, full: 1 },
          },
        },
        store: {
          androidUrl: 'https://play.google.com/store/apps/details?id=com.example.game',
          iosUrl: 'https://apps.apple.com/app/id123456789',
        },
      });

      for (const variant of createVariants(config)) {
        const definitions = createRuntimeDefine(variant, resolvePlayableProfile(variant));
        const definition = Object.values(definitions)[0];

        expect(definition).toBeDefined();
        expect(JSON.parse(definition!)).toMatchObject({ config: { devtools: config.devtools } });
      }
    },
  );
});
