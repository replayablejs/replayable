import { REPLAYABLE_CONTAINER_ID } from '@replayablejs/runtime/shell';
import { defineConfig } from 'tsdown';

import { REPLAYABLE_CANVAS_ID } from './src/host/canvas-ids.ts';

const canvasStyleSelectors = `
  $replayable-container-selector: "#${REPLAYABLE_CONTAINER_ID}";
  $replayable-canvas-selector: "#${REPLAYABLE_CANVAS_ID}";
`;

export default defineConfig({
  clean: true,
  css: {
    minify: true,
    preprocessorOptions: {
      scss: {
        additionalData: canvasStyleSelectors,
      },
    },
  },
  dts: true,
  deps: { neverBundle: ['#webgl-stats'] },
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'browser',
  sourcemap: true,
  target: 'es2022',
});
