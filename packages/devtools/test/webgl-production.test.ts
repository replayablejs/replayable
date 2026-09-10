import { fileURLToPath } from 'node:url';

import { build, normalizePath } from 'vite';
import { expect, it } from 'vitest';

it.each([false, true])('loads context registration only when selected: %s', async (enabled) => {
  const loaded: string[] = [];
  const chunks: string[] = [];
  const entry = fileURLToPath(
    new URL(
      enabled ? '../dist/stats/webgl/enabled.js' : '../dist/stats/webgl/disabled.js',
      import.meta.url,
    ),
  );

  await build({
    configFile: false,
    envDir: false,
    publicDir: false,
    logLevel: 'silent',
    resolve: {
      alias: { '../../src/stats/webgl/context-registry.js': entry },
    },
    build: {
      write: false,
      rolldownOptions: {
        input: fileURLToPath(new URL('./fixtures/webgl-entry.ts', import.meta.url)),
        preserveEntrySignatures: 'strict',
      },
    },
    plugins: [
      {
        name: 'inspect-context-registration',
        generateBundle(_options, bundle) {
          loaded.push(...this.getModuleIds());
          for (const output of Object.values(bundle)) {
            if (output.type === 'chunk') {
              chunks.push(output.code);
            }
          }
        },
      },
    ],
  });

  expect(loaded).toContain(normalizePath(entry));
  expect(loaded.some((id) => id.endsWith('/stats/webgl/enabled.js'))).toBe(enabled);
  expect(chunks.join('\n').includes('new Map')).toBe(enabled);
  expect(loaded.some((id) => /d3-|@replayablejs\/runtime|stats\.scss/.test(id))).toBe(false);
});
