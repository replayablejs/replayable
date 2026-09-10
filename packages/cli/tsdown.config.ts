import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  css: { minify: true },
  dts: false,
  entry: ['src/cli.ts'],
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
  target: 'node24',
});
