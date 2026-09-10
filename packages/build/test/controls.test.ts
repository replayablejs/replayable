import { createVariants, defineConfig } from '@replayablejs/config';
import { expect, it } from 'vitest';

import { resolvePlayableProfile } from '../src/networks/network-profiles.js';
import { createRuntimeDefine } from '../src/runtime/create-runtime-define.js';

it.each([true, false])('resolves controls with authored visibility %s', (enabled) => {
  const config = defineConfig({
    name: 'controls',
    assets: { sourceDir: 'assets', outDir: 'generated', assets: {}, emit: { assets: 'assets.ts' } },
    controls: { persistentCta: enabled },
    localization: { fallback: 'en', languages: ['en'] },
    networks: {
      preview: {},
      applovin: {},
      meta: {},
      google: {},
      liftoff: {},
      mintegral: {},
      moloco: {},
      unity: {},
    },
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
    store: { androidUrl: 'https://example.com/android', iosUrl: 'https://example.com/ios' },
  });

  for (const variant of createVariants(config)) {
    const expected =
      variant.network === 'preview'
        ? config.controls
        : { persistentCta: variant.network === 'liftoff' };
    const profile = resolvePlayableProfile(variant);
    expect(profile.controls).toEqual(expected);

    for (const audio of [true, false]) {
      const definitions = createRuntimeDefine({ ...variant, audio }, profile);
      const definition = Object.values(definitions)[0];
      expect(definition).toBeDefined();
      expect(JSON.parse(definition!)).toMatchObject({
        config: { controls: expected },
      });
    }
  }
});
