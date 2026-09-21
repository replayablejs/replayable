import { fileURLToPath } from 'node:url';

import { buildAssets, defineConfig, type AssetConfigInput } from '@replayablejs/assets';

type Recipe = Pick<AssetConfigInput, 'assets' | 'exclude' | 'bundles'>;
const recipes = new Map<string, { description: string; config: Recipe }>([
  [
    'disabled',
    {
      description: 'Empty rules select no models; omitting models has the same effect.',
      config: { assets: { models: [] } },
    },
  ],
  [
    'defaults',
    {
      description: 'All models; schema defaults: no geometry compression, lossless textures.',
      config: { assets: { models: [{}] } },
    },
  ],
  [
    'meshopt',
    {
      description: 'Recommended project setting: all models with Meshopt.',
      config: { assets: { models: [{ options: { compression: 'meshopt' } }] } },
    },
  ],
  [
    'none',
    {
      description: 'Explicitly disable geometry compression.',
      config: { assets: { models: [{ options: { compression: 'none' } }] } },
    },
  ],
  [
    'draco',
    {
      description: 'Alternative geometry codec: Draco.',
      config: { assets: { models: [{ options: { compression: 'draco' } }] } },
    },
  ],
  [
    'single',
    {
      description: 'Select one flat entry by its category-relative filename.',
      config: { assets: { models: [{ match: 'chest.glb' }] } },
    },
  ],
  [
    'folder',
    {
      description: 'Select all entry files in one pack, following shared dependencies.',
      config: { assets: { models: [{ match: 'platformer-kit/**' }] } },
    },
  ],
  [
    'format',
    {
      description: 'Select only OBJ entry files anywhere under models.',
      config: { assets: { models: [{ match: '**/*.obj' }] } },
    },
  ],
  [
    'rule-exclude',
    {
      description: 'Exclude characters from this rule; other rules can still select them.',
      config: { assets: { models: [{ match: '**', exclude: ['**/character-*.glb'] }] } },
    },
  ],
  [
    'global-exclude',
    {
      description: 'Veto characters across all rules with source-relative paths.',
      config: {
        exclude: ['models/**/character-*.glb'],
        assets: { models: [{ options: { compression: 'meshopt' } }] },
      },
    },
  ],
  [
    'override',
    {
      description: 'Last matching rule replaces all options; chest resets to none and lossless.',
      config: {
        assets: {
          models: [
            { options: { compression: 'meshopt', textures: { quality: 60 } } },
            { match: 'platformer-kit/chest.glb' },
          ],
        },
      },
    },
  ],
  [
    'lossless',
    {
      description: 'Explicit lossless embedded textures at original dimensions.',
      config: {
        assets: {
          models: [{ options: { compression: 'meshopt', textures: { lossless: true, scale: 1 } } }],
        },
      },
    },
  ],
  [
    'lossy',
    {
      description: 'Lossy color textures; quality is an integer from 1 to 100.',
      config: {
        assets: {
          models: [
            { options: { compression: 'meshopt', textures: { lossless: false, quality: 70 } } },
          ],
        },
      },
    },
  ],
  [
    'texture-defaults',
    {
      description: 'Explicit textures:{} uses image defaults: lossless:false, scale:1.',
      config: { assets: { models: [{ options: { compression: 'meshopt', textures: {} } }] } },
    },
  ],
  [
    'scaled',
    {
      description: 'Resize textures to half dimensions with lossless encoding.',
      config: {
        assets: {
          models: [
            { options: { compression: 'meshopt', textures: { lossless: true, scale: 0.5 } } },
          ],
        },
      },
    },
  ],
  [
    'bundles',
    {
      description: 'Move platformer entries to secondary except the tree, which stays primary.',
      config: {
        bundles: {
          secondary: {
            include: ['models/platformer-kit/**'],
            exclude: ['models/platformer-kit/tree.obj'],
          },
        },
        assets: { models: [{ options: { compression: 'meshopt' } }] },
      },
    },
  ],
]);

const requested = process.argv[2] ?? 'list';
if (requested === 'list') {
  for (const [name, recipe] of recipes) {
    console.log(`${name}: ${recipe.description}`);
  }
} else {
  const selected =
    requested === 'all' ? [...recipes] : [...recipes].filter(([name]) => name === requested);
  if (selected.length === 0) {
    throw new Error(
      `Unknown model example: ${requested}. Run models:examples list for supported names.`,
    );
  }
  for (const [name, recipe] of selected) {
    const destination = `dist/model-examples/${name}`;
    const config = defineConfig({
      ...recipe.config,
      sourceDir: 'assets',
      outDir: `${destination}/resources`,
      localization: { language: 'en', fallback: 'en' },
      emit: { assets: `${destination}/assets.ts`, registries: `${destination}/registries` },
    });
    const result = await buildAssets(config, fileURLToPath(new URL('../', import.meta.url)));
    console.log(`${name}: ${result.emittedAssets} assets → ${result.outputDirectory}`);
  }
}
