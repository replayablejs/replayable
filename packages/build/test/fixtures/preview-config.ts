/** Minimal authored project used to test CLI delegation without building assets. */
export const config = {
  name: 'cli-test',
  assets: {
    sourceDir: 'assets',
    outDir: 'generated/resources',
    assets: {},
    emit: { assets: 'generated/assets.ts' },
  },
  localization: { fallback: 'en', languages: ['en'] },
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
};
