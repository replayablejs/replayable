import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Exercise the real inline viewer stylesheet, not Vitest's empty CSS stub.
    css: { include: [/config-viewer\.css/] },
  },
});
