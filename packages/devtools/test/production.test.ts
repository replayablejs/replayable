import { fileURLToPath } from 'node:url';

import { build } from 'vite';
import { expect, it } from 'vitest';

it.each([
  { entry: 'entry.ts', development: false, enabled: false },
  { entry: 'entry.ts', development: true, enabled: true },
  { entry: 'entry.ts', development: true, enabled: false },
  { entry: 'package-entry.ts', development: false, enabled: false },
  { entry: 'package-entry.ts', development: true, enabled: true },
  { entry: 'package-entry.ts', development: true, enabled: false },
])(
  'selects stats from $entry with DEV=$development and enabled=$enabled',
  async ({ entry, development, enabled }) => {
    const chunks: string[] = [];
    const assets: string[] = [];
    const renderedModules: string[] = [];
    const loadedModules: string[] = [];
    const statsEntry =
      entry === 'entry.ts'
        ? enabled
          ? '../src/create-stats.ts'
          : '../src/stats/create-disabled-stats.ts'
        : enabled
          ? '../dist/stats/enabled.js'
          : '../dist/stats/disabled.js';
    await build({
      configFile: false,
      envDir: false,
      publicDir: false,
      logLevel: 'silent',
      define: { 'import.meta.env.DEV': JSON.stringify(development) },
      resolve: {
        alias: {
          '#stats': fileURLToPath(new URL(statsEntry, import.meta.url)),
          '#endcard-trigger': fileURLToPath(
            new URL('../src/endcard-trigger/disabled.ts', import.meta.url),
          ),
          '#sound-control': fileURLToPath(
            new URL('../src/sound-control/disabled.ts', import.meta.url),
          ),
          '@replayablejs/runtime': fileURLToPath(new URL('./fixtures/runtime.ts', import.meta.url)),
        },
      },
      build: {
        write: false,
        rolldownOptions: {
          input: fileURLToPath(new URL(`./fixtures/${entry}`, import.meta.url)),
          output: { format: 'es' },
          preserveEntrySignatures: 'strict',
        },
      },
      plugins: [
        {
          name: 'inspect-stats-output',
          generateBundle(_options, bundle) {
            loadedModules.push(...this.getModuleIds());
            for (const output of Object.values(bundle)) {
              if (output.type === 'chunk') {
                chunks.push(output.code);
                for (const [id, module] of Object.entries(output.modules)) {
                  // Loaded modules can be fully tree-shaken. Only count modules
                  // that actually contribute code to the delivered JavaScript.
                  if (module.renderedLength > 0) {
                    renderedModules.push(id.replaceAll('\\', '/'));
                  }
                }
              } else {
                assets.push(output.fileName);
              }
            }
          },
        },
      ],
    });

    const source = chunks.join('\n');
    expect(source).toContain('destroy');
    expect(assets).toEqual([]);
    for (const marker of [
      'replayable-stats',
      'usedJSHeapSize',
      'performance.now',
      'visibilitychange',
      'createElement',
      'safe-area-inset-bottom',
      'replayable-stats__graph',
      'Show next stats card',
      'webglcontextlost',
      'webglcontextrestored',
      'ANGLE_instanced_arrays',
      'WEBGL_multi_draw',
      'Texture binds',
      'Program uses',
    ]) {
      expect(source.includes(marker)).toBe(enabled);
    }
    for (const dependency of ['d3-shape', 'd3-scale']) {
      expect(renderedModules.some((id) => id.includes(`/node_modules/${dependency}/`))).toBe(
        enabled,
      );
    }
    // Source-level inspection can identify individual helpers. The package build
    // combines them, so both paths also check behavior markers and D3 above.
    for (const module of [
      'create-stats-sampler.ts',
      'create-stats-sampling-clock.ts',
      'create-stats-metrics.ts',
      'create-webgl-tracker.ts',
      'subscribe-webgl-frames.ts',
      'create-webgl-metric.ts',
    ]) {
      expect(renderedModules.some((id) => id.endsWith(`/${module}`))).toBe(
        entry === 'entry.ts' && enabled,
      );
    }
    expect(
      renderedModules.some((id) => /\/node_modules\/d3-(timer|transition|selection)\//.test(id)),
    ).toBe(false);
    // Disabled selection must avoid visiting the graph, not merely tree-shake it later.
    expect(loadedModules.some((id) => /d3-(shape|scale)/.test(id))).toBe(enabled);
    // Runtime supplies postRender; devtools never loads its own Motion scheduler.
    expect(loadedModules.some((id) => /\/motion-dom\//.test(id))).toBe(false);
  },
);
