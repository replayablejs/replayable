import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/** Unit tests use a runtime fixture; lifecycle tests replace it with their own mocks. */
export default defineConfig({
  resolve: {
    alias: {
      '@replayablejs/runtime': fileURLToPath(
        new URL('./test/fixtures/runtime.ts', import.meta.url),
      ),
    },
  },
});
