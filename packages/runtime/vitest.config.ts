import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Production replaces this virtual binding with the variant's selected
    // audio implementation. Tests need one concrete module for Vite resolution
    // before individual suites can mock the binding.
    alias: [
      {
        find: /^#audio$/,
        replacement: fileURLToPath(new URL('./src/audio/disabled.ts', import.meta.url)),
      },
    ],
  },
});
