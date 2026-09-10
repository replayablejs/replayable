import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/spine/index.ts'],
  format: ['esm'],
  platform: 'browser',
  sourcemap: true,
  target: 'es2022',
});
