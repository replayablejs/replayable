import { defineConfig } from '@replayablejs/config';

export default defineConfig({
  name: 'hello-playable',
  assets: {
    sourceDir: 'assets',
    outDir: 'src/assets/resources',
    assets: {},
    emit: { assets: 'src/assets/assets.ts' },
  },
  localization: { languages: ['en'], fallback: 'en' },
  screen: {
    orientations: {
      portrait: {
        enabled: true,
        width: 390,
        height: 844,
        ratio: { min: 0.4, max: 1 },
      },
      landscape: {
        enabled: true,
        width: 844,
        height: 390,
        ratio: { min: 1, max: 2.5 },
      },
    },
    resolution: {
      pixelRatio: { min: 1, max: 2 },
      renderScale: { minimal: 0.5, reduced: 0.65, balanced: 0.85, full: 1 },
    },
  },
  store: {
    androidUrl: 'https://play.google.com/store/apps/details?id=com.example.app',
    iosUrl: 'https://apps.apple.com/app/id123456789',
  },
});
