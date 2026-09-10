import {
  REPLAYABLE_CONTAINER_ID,
  REPLAYABLE_LOADING_INDICATOR_ID,
  REPLAYABLE_ROOT_ID,
} from '@replayablejs/runtime/shell';
import { defineConfig } from 'tsdown';

import { PLAYABLE_BROWSER_TARGETS } from '#browser-targets';

const playableShellSelectors = `
  $replayable-root-selector: "#${REPLAYABLE_ROOT_ID}";
  $replayable-container-selector: "#${REPLAYABLE_CONTAINER_ID}";
  $replayable-loading-indicator-selector: "#${REPLAYABLE_LOADING_INDICATOR_ID}";
`;

export default defineConfig({
  clean: true,
  css: {
    minify: true,
    preprocessorOptions: {
      scss: {
        additionalData: playableShellSelectors,
      },
    },
    target: [...PLAYABLE_BROWSER_TARGETS],
  },
  deps: {
    neverBundle: ['#generated-assets', '#selected-adapter'],
  },
  dts: true,
  entry: {
    index: 'src/index.ts',
    'runtime/bindings/adapter': 'src/runtime/bindings/adapter.ts',
    'runtime/bindings/assets': 'src/runtime/bindings/assets.ts',
    'runtime/bindings/definition': 'src/runtime/bindings/definition.ts',
    'runtime/entries/assets': 'src/runtime/entries/assets.ts',
    'runtime/entries/config': 'src/runtime/entries/config.ts',
    'runtime/entries/host': 'src/runtime/entries/host.ts',
  },
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
  target: 'node24',
});
