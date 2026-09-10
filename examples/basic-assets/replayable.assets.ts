import { defineConfig } from '@replayablejs/assets';

export default defineConfig({
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  localization: {
    fallback: 'en',
    language: 'hy',
  },
  bundles: {
    secondary: {
      include: ['sounds/theme-*', 'spines/raptor'],
    },
  },
  assets: {
    atlases: [
      {
        options: { padding: 2, powerOfTwo: false, scale: 1 },
      },
    ],
    fonts: [
      {
        match: 'NotoSansArmenian.*',
        // Every font automatically keeps printable ASCII plus the characters
        // selected from translations.jsonc. Add only text that is created
        // outside those dictionaries, such as legal or UI symbols.
        options: { extraCharacters: '©™֏', family: 'Noto Sans Armenian' },
      },
      {
        match: 'SourceSerif4-Regular.*',
        // No character option is necessary when all rendered text comes from
        // the resolved translation dictionary.
        options: { family: 'Source Serif 4' },
      },
    ],
    locales: [{ match: '**' }],
    shaders: [{ match: '**' }],
    sprites: [
      {
        options: { quality: 70, scale: 1 },
      },
    ],
    sounds: [
      {
        options: { bitrate: 96, channels: 'mono', sampleRate: 32000 },
      },
    ],
    spines: [
      {
        options: { quality: 70, scale: 1 },
      },
      {
        // Spine rules match the logical export directory itself, not its files.
        match: 'raptor',
        options: { quality: 90, scale: 0.5 },
      },
    ],
  },
  emit: {
    assets: 'src/assets/assets.ts',
    registries: 'src/assets/registries',
  },
});
