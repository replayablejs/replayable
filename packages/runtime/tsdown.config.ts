import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  deps: {
    neverBundle: ['#adapter', '#assets', '#audio', '#definition'],
  },
  dts: true,
  entry: {
    assets: 'src/assets/index.ts',
    'audio/disabled': 'src/audio/disabled.ts',
    'audio/enabled': 'src/audio/enabled.ts',
    index: 'src/index.ts',
    shell: 'src/shell/index.ts',
    'adapters/applovin': 'src/adapters/applovin/index.ts',
    'adapters/browser': 'src/adapters/browser/index.ts',
    'adapters/google': 'src/adapters/google/index.ts',
    'adapters/liftoff': 'src/adapters/liftoff/index.ts',
    'adapters/meta': 'src/adapters/meta/index.ts',
    'adapters/mintegral': 'src/adapters/mintegral/index.ts',
    'adapters/moloco': 'src/adapters/moloco/index.ts',
    'adapters/unity': 'src/adapters/unity/index.ts',
  },
  format: ['esm'],
  platform: 'browser',
  sourcemap: true,
  target: 'es2022',
});
