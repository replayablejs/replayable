import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  createVariants,
  defineConfig,
  replayableConfigSchema,
  type PlayableVariant,
  type ReplayableConfig,
  type ReplayableConfigInput,
} from '../src/index.js';

const assets = {
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  assets: {},
  emit: { assets: 'src/assets/assets.ts' },
};
const store = {
  androidUrl: 'https://play.google.com/store/apps/details?id=com.example.game',
  iosUrl: 'https://apps.apple.com/app/id123456789',
};
const screen = {
  orientations: {
    portrait: {
      enabled: true,
      width: 700,
      height: 1400,
      ratio: { min: 0.46, max: 0.76 },
    },
    landscape: {
      enabled: true,
      width: 1400,
      height: 700,
      ratio: { min: 0.46, max: 0.76 },
    },
  },
  resolution: {
    pixelRatio: { min: 1, max: 2 },
    renderScale: { minimal: 0.55, reduced: 0.65, balanced: 0.85, full: 1 },
  },
};

describe('Replayable config', () => {
  it('defaults the endcard trigger off and accepts only boolean preferences', () => {
    const input = {
      assets,
      screen,
      store,
      name: 'trigger',
      localization: { fallback: 'en', languages: ['en'] },
    };
    expect(defineConfig(input).devtools.endCardTrigger).toBe(false);
    expect(
      defineConfig({ ...input, devtools: { endCardTrigger: true } }).devtools.endCardTrigger,
    ).toBe(true);
    expect(
      replayableConfigSchema.safeParse({ ...input, devtools: { endCardTrigger: 'yes' } }).success,
    ).toBe(false);
  });
  it('carries authored control preferences into every variant for profile resolution', () => {
    const controls = { persistentCta: false };
    const config = defineConfig({
      assets,
      screen,
      store,
      controls,
      name: 'controls',
      localization: { fallback: 'en', languages: ['en'] },
      networks: { preview: {}, liftoff: {}, meta: {} },
    });
    for (const variant of createVariants(config)) {
      expect(variant.controls).toEqual(controls);
    }
  });

  it('validates authored input and applies project defaults', () => {
    const input = {
      assets,
      localization: { fallback: 'en', languages: ['en', 'hy'] },
      name: '  basic-playable  ',
      screen,
      store,
    } satisfies ReplayableConfigInput;
    const config = defineConfig(input);

    expectTypeOf(config).toEqualTypeOf<ReplayableConfig>();
    expect(config).toMatchObject({
      audio: true,
      backgroundColor: '#000000',
      build: { outDir: 'dist' },
      completion: {},
      devtools: { stats: false },
      entry: 'src/main.ts',
      localization: { fallback: 'en', languages: ['en', 'hy'] },
      name: 'basic-playable',
      networks: { preview: {} },
      params: {},
      versions: { default: {} },
    });
    expect(config.assets.exclude).toEqual([]);
  });

  it.each([
    [undefined, false],
    [{}, false],
    [{ stats: false }, false],
    [{ stats: true }, { display: 'expanded', fps: true, frameInterval: true, jsHeap: true }],
    [{ stats: {} }, { display: 'expanded', fps: true, frameInterval: true, jsHeap: true }],
    [
      { stats: { fps: false } },
      { display: 'expanded', fps: false, frameInterval: true, jsHeap: true },
    ],
    [
      { stats: { display: 'expanded' } },
      { display: 'expanded', fps: true, frameInterval: true, jsHeap: true },
    ],
    [
      { stats: { display: 'compact', jsHeap: false } },
      { display: 'compact', fps: true, frameInterval: true, jsHeap: false },
    ],
    [
      { stats: { fps: false, frameInterval: false, jsHeap: false } },
      { display: 'expanded', fps: false, frameInterval: false, jsHeap: false },
    ],
  ] as const)('normalizes development stats %j', (devtools, expected) => {
    const config = replayableConfigSchema.parse({
      assets,
      devtools,
      localization: { fallback: 'en', languages: ['en'] },
      name: 'stats',
      networks: { preview: {}, meta: {} },
      versions: { default: {}, alternative: {} },
      screen,
      store,
    });

    expect(config.devtools.stats).toEqual(
      expected === false
        ? false
        : {
            drawCalls: true,
            textureBinds: true,
            programUses: true,
            ...expected,
          },
    );
    for (const variant of createVariants(config)) {
      expect(variant.devtools).toEqual(config.devtools);
    }
  });

  it.each([
    { stats: { unknown: true } },
    { stats: { display: 'stacked' } },
    { stats: { display: true } },
    { stats: { display: null } },
    { unknown: true },
    { stats: 'true' },
    { stats: null },
    { stats: { fps: 1 } },
    { stats: { frameInterval: 'false' } },
    { stats: { jsHeap: null } },
    { stats: { drawCalls: 1 } },
    { stats: { textureBinds: 'true' } },
    { stats: { programUses: null } },
  ])('rejects invalid development stats %j', (devtools) => {
    expect(
      replayableConfigSchema.safeParse({
        assets,
        devtools,
        localization: { fallback: 'en', languages: ['en'] },
        name: 'stats',
        screen,
        store,
      }).success,
    ).toBe(false);
  });

  it.each(['networks', 'versions'])('rejects devtools overrides in %s', (dimension) => {
    expect(
      replayableConfigSchema.safeParse({
        assets,
        [dimension]: { preview: { devtools: { stats: true } } },
        localization: { fallback: 'en', languages: ['en'] },
        name: 'stats',
        screen,
        store,
      }).success,
    ).toBe(false);
  });

  it('validates project and variant completion timer configuration', () => {
    const project = {
      assets,
      completion: { duration: 30, inactivity: 15 },
      localization: { fallback: 'en', languages: ['en'] },
      name: 'completion-policy',
      networks: {
        applovin: { completion: { duration: false } },
        preview: {},
      },
      screen,
      store,
      versions: {
        default: {},
        short: { completion: { duration: 15, inactivity: false } },
      },
    } satisfies ReplayableConfigInput;

    expect(defineConfig(project).completion).toEqual({ duration: 30, inactivity: 15 });
    expect(replayableConfigSchema.safeParse(project).success).toBe(true);

    expect(
      createVariants(defineConfig(project)).map(({ completion, id }) => ({ completion, id })),
    ).toEqual([
      {
        completion: { duration: 30, inactivity: 15 },
        id: 'default/preview/en',
      },
      {
        completion: { inactivity: 15 },
        id: 'default/applovin/en',
      },
      {
        completion: { duration: 15 },
        id: 'short/preview/en',
      },
      {
        completion: {},
        id: 'short/applovin/en',
      },
    ]);

    expect(
      replayableConfigSchema.safeParse({
        ...project,
        completion: { duration: 0 },
      }).success,
    ).toBe(false);
    expect(
      replayableConfigSchema.safeParse({
        ...project,
        networks: { applovin: { completion: { inactivity: true } } },
      }).success,
    ).toBe(false);
  });

  it('creates every version, network, and language combination', () => {
    const variants = createVariants(
      defineConfig({
        assets: {
          ...assets,
          exclude: ['sprites/debug/**'],
        },
        backgroundColor: '#123456',
        entry: 'src/default.ts',
        localization: { fallback: 'en', languages: ['en', 'hy'] },
        name: 'renovation',
        networks: {
          meta: {
            assets: { exclude: ['sounds/music/**'] },
            params: { difficulty: 2 },
          },
          preview: {},
        },
        params: {
          difficulty: {
            type: 'number',
            default: 1,
            description: 'Gameplay difficulty.',
            range: { min: 1, max: 3, step: 1 },
          },
          theme: {
            type: 'string',
            default: 'default',
            description: 'Visual theme.',
            options: ['default', 'christmas'],
          },
        },
        screen,
        store,
        versions: {
          christmas: {
            assets: { exclude: ['sprites/summer/**'] },
            params: { theme: 'christmas' },
          },
          default: {},
        },
      }),
    );

    expect(variants).toHaveLength(8);
    expect(new Set(variants.map(({ id }) => id))).toEqual(
      new Set([
        'christmas/meta/en',
        'christmas/meta/hy',
        'christmas/preview/en',
        'christmas/preview/hy',
        'default/meta/en',
        'default/meta/hy',
        'default/preview/en',
        'default/preview/hy',
      ]),
    );

    const christmasMeta = variants.find(({ id }) => id === 'christmas/meta/en');

    expect(christmasMeta).toMatchObject({
      backgroundColor: '#123456',
      entry: 'src/default.ts',
      id: 'christmas/meta/en',
      localization: { fallback: 'en', language: 'en' },
      network: 'meta',
      params: { difficulty: 2, theme: 'christmas' },
      projectName: 'renovation',
      store: {
        androidUrl: 'https://play.google.com/store/apps/details?id=com.example.game',
        iosUrl: 'https://apps.apple.com/app/id123456789',
      },
      version: 'christmas',
    });
    expect(christmasMeta?.assets.exclude).toEqual([
      'sprites/debug/**',
      'sounds/music/**',
      'sprites/summer/**',
    ]);
    expectTypeOf(christmasMeta).toEqualTypeOf<PlayableVariant | undefined>();
  });

  it('resolves project, network, and version audio capability monotonically', () => {
    const createProject = () => ({
      assets,
      localization: { fallback: 'en', languages: ['en'] },
      name: 'audio-capability',
      networks: {
        google: { audio: false as const },
        preview: {},
      },
      screen,
      store,
      versions: {
        default: {},
        silent: { audio: false as const },
      },
    });
    const variants = createVariants(defineConfig(createProject()));

    expect(
      variants.map(({ assets: variantAssets, audio, id }) => ({
        audio,
        id,
        soundExclusions: variantAssets.exclude.filter((pattern) => pattern === 'sounds/**'),
      })),
    ).toEqual([
      { audio: true, id: 'default/preview/en', soundExclusions: [] },
      { audio: false, id: 'default/google/en', soundExclusions: ['sounds/**'] },
      { audio: false, id: 'silent/preview/en', soundExclusions: ['sounds/**'] },
      { audio: false, id: 'silent/google/en', soundExclusions: ['sounds/**'] },
    ]);

    const projectDisabled = createVariants(defineConfig({ ...createProject(), audio: false }));

    expect(projectDisabled.every(({ audio }) => !audio)).toBe(true);
    expect(
      projectDisabled.every(
        ({ assets: variantAssets }) =>
          variantAssets.exclude.filter((pattern) => pattern === 'sounds/**').length === 1,
      ),
    ).toBe(true);

    const authoredExclusion = createVariants(
      defineConfig({
        ...createProject(),
        assets: { ...assets, exclude: ['sounds/**'] },
      }),
    );

    expect(
      authoredExclusion.every(
        ({ assets: variantAssets }) =>
          variantAssets.exclude.filter((pattern) => pattern === 'sounds/**').length === 1,
      ),
    ).toBe(true);
  });

  it('does not allow variant overrides to re-enable audio', () => {
    const project = {
      assets,
      localization: { fallback: 'en', languages: ['en'] },
      name: 'audio-override',
      screen,
      store,
    };

    expect(
      replayableConfigSchema.safeParse({
        ...project,
        networks: { google: { audio: true } },
      }).success,
    ).toBe(false);
    expect(
      replayableConfigSchema.safeParse({
        ...project,
        versions: { default: { audio: true } },
      }).success,
    ).toBe(false);
  });

  it('rejects invalid dimensions, localization, and unknown fields', () => {
    expect(
      replayableConfigSchema.safeParse({
        assets,
        backgroundColor: 'purple',
        localization: { fallback: 'en', languages: ['en'] },
        name: 'invalid-background',
        screen,
        store,
      }).success,
    ).toBe(false);
    expect(
      replayableConfigSchema.safeParse({
        assets,
        localization: { fallback: 'en', languages: ['hy'] },
        name: 'missing-fallback',
        screen,
        store,
      }).success,
    ).toBe(false);
    expect(
      replayableConfigSchema.safeParse({
        assets,
        localization: { fallback: 'en', languages: ['en'] },
        name: 'missing-version',
        screen,
        store,
        versions: {},
      }).success,
    ).toBe(false);
    expect(
      replayableConfigSchema.safeParse({
        assets,
        language: 'en',
        localization: { fallback: 'en', languages: ['en'] },
        name: 'unknown-field',
        screen,
        store,
      }).success,
    ).toBe(false);
  });

  it('requires a complete, strict, positive, and ordered render-scale policy', () => {
    const project = {
      assets,
      localization: { fallback: 'en', languages: ['en'] },
      name: 'render-scale-policy',
      screen,
      store,
    };
    const parseRenderScale = (renderScale: unknown) =>
      replayableConfigSchema.safeParse({
        ...project,
        screen: {
          ...screen,
          resolution: { ...screen.resolution, renderScale },
        },
      });

    expect(parseRenderScale(screen.resolution.renderScale).success).toBe(true);
    expect(parseRenderScale({ minimal: 0.55, reduced: 0.65, balanced: 0.85 }).success).toBe(false);
    expect(parseRenderScale({ ...screen.resolution.renderScale, cinematic: 1 }).success).toBe(
      false,
    );
    expect(parseRenderScale({ ...screen.resolution.renderScale, minimal: 0 }).success).toBe(false);
    expect(parseRenderScale({ ...screen.resolution.renderScale, full: 1.01 }).success).toBe(false);
    expect(parseRenderScale({ ...screen.resolution.renderScale, reduced: 0.5 }).success).toBe(
      false,
    );
  });

  it('rejects the obsolete flat screen resolution properties', () => {
    const { resolution: _resolution, ...screenWithoutResolution } = screen;

    expect(
      replayableConfigSchema.safeParse({
        assets,
        localization: { fallback: 'en', languages: ['en'] },
        name: 'obsolete-screen-resolution',
        screen: {
          ...screenWithoutResolution,
          gpuTierScales: { 0: 0.55, 1: 0.65, 2: 0.85, 3: 1 },
          pixelRatio: { max: 2, min: 1 },
        },
        store,
      }).success,
    ).toBe(false);
  });

  it('requires deterministic parameter values', () => {
    const project = {
      assets,
      localization: { fallback: 'en', languages: ['en'] },
      name: 'deterministic-params',
      screen,
      store,
    };

    expect(
      replayableConfigSchema.safeParse({
        ...project,
        params: {
          intensity: {
            type: 'number',
            default: 0.5,
            description: 'Effect intensity.',
            range: { min: 0, max: 1, step: 0.25 },
          },
        },
      }).success,
    ).toBe(true);
    expect(
      replayableConfigSchema.safeParse({
        ...project,
        params: {
          intensity: {
            type: 'number',
            default: 0.3,
            description: 'Effect intensity.',
            range: { min: 0, max: 1, step: 0.25 },
          },
        },
      }).success,
    ).toBe(false);
    expect(
      replayableConfigSchema.safeParse({
        ...project,
        params: {
          theme: {
            type: 'string',
            default: 'default',
            description: 'Visual theme.',
          },
        },
      }).success,
    ).toBe(false);
    expect(
      replayableConfigSchema.safeParse({
        ...project,
        params: {
          snowEnabled: {
            type: 'boolean',
            default: true,
            description: 'Whether snow is displayed.',
            when: { param: 'theme', equals: 'summer' },
          },
          theme: {
            type: 'string',
            default: 'default',
            description: 'Visual theme.',
            options: ['default', 'winter'],
          },
        },
      }).success,
    ).toBe(false);
  });
});

describe('variant bundle assignments', () => {
  const base = {
    assets: {
      ...assets,
      exclude: ['sprites/debug/**'],
      bundles: { secondary: { include: ['sounds/**'], exclude: ['sounds/start.*'] } },
    },
    screen,
    store,
    name: 'bundles',
    localization: { fallback: 'en', languages: ['en'] },
  };

  it('inherits project bundles when an override only excludes assets', () => {
    const config = defineConfig({
      ...base,
      versions: { tutorial: { assets: { exclude: ['sprites/unused.*'] } } },
    });
    const [variant] = createVariants(config);
    expect(variant?.assets.bundles).toEqual(base.assets.bundles);
    expect(variant?.assets.exclude).toEqual(['sprites/debug/**', 'sprites/unused.*']);
  });

  it('replaces the complete selection with the network selection last', () => {
    const networkBundles = { secondary: { include: ['sprites/**'] } };
    const versionBundles = { secondary: { include: ['sounds/later.*'] } };
    const config = defineConfig({
      ...base,
      networks: { preview: { assets: { bundles: networkBundles } } },
      versions: {
        inherited: {},
        tutorial: { assets: { bundles: versionBundles } },
        free: { assets: { bundles: {} } },
      },
    });
    const variants = createVariants(config);
    expect(variants.map((variant) => variant.assets.bundles)).toEqual([
      networkBundles,
      networkBundles,
      networkBundles,
    ]);
    expect(config.assets.bundles).toEqual(base.assets.bundles);
  });

  it('allows a network to clear secondary even when a version selects it', () => {
    const config = defineConfig({
      ...base,
      networks: { preview: { assets: { bundles: {} } } },
      versions: { free: {}, tutorial: { assets: { bundles: base.assets.bundles } } },
    });
    expect(createVariants(config).map((variant) => variant.assets.bundles)).toEqual([{}, {}]);
  });

  it('rejects invalid selections in either override dimension', () => {
    for (const dimension of ['versions', 'networks']) {
      expect(() =>
        defineConfig({
          ...base,
          [dimension]: { preview: { assets: { bundles: { secondary: { include: [] } } } } },
        }),
      ).toThrow(/include/);
    }
  });
});

describe('network override precedence', () => {
  it('resolves conflicts per parameter and completion timer while inheriting omitted values', () => {
    const config = defineConfig({
      assets,
      screen,
      store,
      name: 'precedence',
      localization: { fallback: 'en', languages: ['en'] },
      completion: { duration: 60, inactivity: 20 },
      params: {
        difficulty: {
          type: 'number',
          default: 1,
          description: 'Difficulty.',
          range: { min: 1, max: 3, step: 1 },
        },
        theme: {
          type: 'string',
          default: 'base',
          description: 'Theme.',
          options: ['base', 'custom'],
        },
      },
      versions: {
        custom: {
          params: { difficulty: 2, theme: 'custom' },
          completion: { duration: 45, inactivity: false },
        },
      },
      networks: {
        preview: {},
        unity: { params: { difficulty: 3 }, completion: { duration: false, inactivity: 10 } },
      },
    });
    const variants = createVariants(config);
    expect(variants.find(({ network }) => network === 'preview')).toMatchObject({
      params: { difficulty: 2, theme: 'custom' },
      completion: { duration: 45 },
    });
    expect(
      variants.find(({ network }) => network === 'preview')?.completion.inactivity,
    ).toBeUndefined();
    expect(variants.find(({ network }) => network === 'unity')).toMatchObject({
      params: { difficulty: 3, theme: 'custom' },
      completion: { inactivity: 10 },
    });
    expect(
      variants.find(({ network }) => network === 'unity')?.completion.duration,
    ).toBeUndefined();
  });
});

it('defaults export naming and accepts a custom template', () => {
  const input = {
    assets,
    screen,
    store,
    name: 'City Builder',
    localization: { fallback: 'en', languages: ['en'] },
  };
  expect(defineConfig(input).export.filename).toBe('{network}_{version}_{language}');
  expect(
    defineConfig({ ...input, export: { filename: '{name}_{language}_{network}_{version}' } }).export
      .filename,
  ).toBe('{name}_{language}_{network}_{version}');
});

it.each([
  '',
  '../{name}',
  'folder\\{name}',
  '{unknown}',
  '{name',
  '{network}.zip',
  '{network}.html',
])('rejects invalid export template %s', (filename) => {
  expect(() =>
    defineConfig({
      assets,
      screen,
      store,
      name: 'City',
      localization: { fallback: 'en', languages: ['en'] },
      export: { filename },
    }),
  ).toThrow(/export/u);
});
