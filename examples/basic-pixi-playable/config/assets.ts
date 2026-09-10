import type { ReplayableAssetsConfigInput } from '@replayablejs/config';

/** Loads visual assets at startup and keeps sounds in the deferred secondary bundle. */
export default {
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  bundles: {
    secondary: { include: ['sounds/**'] },
  },
  assets: {
    atlases: [{}],
    fonts: [
      {
        match: 'PatrickHand-Regular.*',
        options: { family: 'Patrick Hand' },
      },
    ],
    locales: [{}],
    spines: [{}],
    sprites: [{}],
    shaders: [{}],
    sounds: [{}],
  },
  emit: {
    assets: 'src/assets/assets.ts',
    registries: 'src/assets/registries',
  },
} satisfies ReplayableAssetsConfigInput;
