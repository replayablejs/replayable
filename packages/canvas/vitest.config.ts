import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@replayablejs/runtime': fileURLToPath(new URL('./test/runtime.ts', import.meta.url)),
      '#webgl-stats': fileURLToPath(new URL('./test/webgl-stats.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
