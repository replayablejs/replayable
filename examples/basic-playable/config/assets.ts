import type { ReplayableAssetsConfigInput } from '@replayablejs/config';

export default {
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  bundles: {
    secondary: {
      include: ['sounds/**'],
    },
  },
  assets: {
    sprites: [{}],
    fonts: [
      {
        match: 'NotoSansArmenian.*',
        options: { family: 'Noto Sans Armenian' },
      },
    ],
    locales: [{}],
    sounds: [
      {},
      {
        match: 'music-*',
        options: { bitrate: 48, sampleRate: 22050 },
      },
    ],
  },
  emit: {
    assets: 'src/assets/assets.ts',
    registries: 'src/assets/registries',
  },
} satisfies ReplayableAssetsConfigInput;
