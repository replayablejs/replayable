import type { ReplayableAssetsConfigInput } from '@replayablejs/config';

export default {
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  bundles: {
    secondary: { include: ['sounds/**', 'sprites/ui/endcard-button.png'] },
  },
  assets: {
    // These models retain UVs but have no texture references. The scene will
    // apply the separately loaded city palette to their materials.
    models: [{ options: { compression: 'meshopt' } }],
    textures: [{ options: { lossless: true } }],
    sprites: [{}],
    locales: [{}],
    fonts: [{ options: { family: 'Kenney Future' } }],
    sounds: [{ options: { bitrate: 96, channels: 'mono', sampleRate: 32000 } }],
  },
  emit: {
    assets: 'src/assets/assets.ts',
    registries: 'src/assets/registries',
  },
} satisfies ReplayableAssetsConfigInput;
