import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  css: { minify: true },
  dts: true,
  deps: { neverBundle: ['#stats', '#endcard-trigger', '#sound-control'] },
  loader: { '.png': 'dataurl' },
  entry: {
    index: 'src/index.ts',
    'sound-control/enabled': 'src/create-sound-control.ts',
    'sound-control/disabled': 'src/sound-control/disabled.ts',
    'endcard-trigger/enabled': 'src/create-end-card-trigger.ts',
    'endcard-trigger/disabled': 'src/endcard-trigger/disabled.ts',
    'stats/enabled': 'src/create-stats.ts',
    'stats/disabled': 'src/stats/create-disabled-stats.ts',
    'stats/webgl/enabled': 'src/stats/webgl/context-registry.ts',
    'stats/webgl/disabled': 'src/stats/webgl/disabled.ts',
  },
  format: ['esm'],
  platform: 'browser',
  sourcemap: true,
  target: 'es2022',
});
