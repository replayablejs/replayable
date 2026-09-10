import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: ['src/index.ts'],
    format: ['esm'],
    platform: 'node',
    sourcemap: true,
    target: 'node24',
  },
  {
    clean: false,
    dts: false,
    entry: {
      'compressed-module-loader': 'src/browser/compressed-module-loader.ts',
    },
    format: ['esm'],
    outDir: 'dist/browser',
    outputOptions: {
      codeSplitting: false,
    },
    platform: 'browser',
    sourcemap: false,
    target: ['ios16.1', 'chrome105'],
  },
]);
