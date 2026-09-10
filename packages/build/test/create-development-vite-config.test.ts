import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createServer } from 'vite';
import { expect, it } from 'vitest';

import { createDevelopmentViteConfig } from '../src/vite/create-development-vite-config.js';

it.each(['object', 'array'] as const)(
  'optimizes installed packages with %s aliases and invalidates cached selections',
  async (form) => {
    // Windows TEMP may use an 8.3 path (RUNNER~1), which Vite refuses to serve.
    const projectRoot = await realpath(await mkdtemp(join(tmpdir(), 'replayable-dev-aliases-')));
    const packageNames = ['@replayablejs/runtime', '@replayablejs/devtools'] as const;
    const selected = {
      '#adapter': 'adapter',
      '#assets': 'assets',
      '#definition': 'definition',
      '#audio': 'audio',
      '#stats': 'stats',
      '#sound-control': 'soundControl',
      '#endcard-trigger': 'endCardTrigger',
    };
    const aliases: Record<string, string> = {};
    try {
      // Installed packages, not workspace symlinks: the npm-consumer failure mode.
      for (const [name, entries] of [
        [packageNames[0], Object.entries(selected).slice(0, 4)],
        [packageNames[1], Object.entries(selected).slice(4)],
      ] as const) {
        const directory = join(projectRoot, 'node_modules', name);
        await mkdir(directory, { recursive: true });
        await writeFile(
          join(directory, 'package.json'),
          JSON.stringify({
            name,
            version: '1.0.0',
            type: 'module',
            exports: './index.js',
            imports: { '#types/*': './types/*' },
          }),
        );
        await writeFile(
          join(directory, 'index.js'),
          entries.map(([alias, value]) => `export { ${value} } from '${alias}';`).join('\n'),
        );
      }
      for (const [alias, name] of Object.entries(selected)) {
        const file = join(projectRoot, `${name}.js`);
        aliases[alias] = file;
        await writeFile(file, `export const ${name} = 'selected-${name}';`);
      }
      const commonjs = join(projectRoot, 'node_modules', 'audio-backend');
      await mkdir(commonjs, { recursive: true });
      await writeFile(
        join(commonjs, 'package.json'),
        JSON.stringify({ name: 'audio-backend', main: 'index.cjs' }),
      );
      await writeFile(
        join(commonjs, 'index.cjs'),
        `exports.Sound = class Sound { static kind = 'enabled-audio-backend'; };`,
      );
      await writeFile(
        join(projectRoot, 'audio.js'),
        `import { Sound } from 'audio-backend'; export const audio = Sound.kind;`,
      );
      const disabled = join(projectRoot, 'disabled.js');
      await writeFile(
        disabled,
        `export const audio = 'disabled-audio-backend'; export const stats = 'disabled-stats';`,
      );
      const entry = join(projectRoot, 'main.js');
      await writeFile(entry, packageNames.map((name) => `import '${name}';`).join('\n'));
      const emptyEntry = { input: entry, viteConfig: {} };
      async function optimizeFixture() {
        const alias =
          form === 'array'
            ? Object.entries(aliases).map(([find, replacement]) => ({ find, replacement }))
            : { ...aliases };
        const config = createDevelopmentViteConfig({
          projectRoot,
          entries: {
            host: emptyEntry,
            assets: emptyEntry,
            config: emptyEntry,
            application: { input: entry, viteConfig: { resolve: { alias } } },
          },
        });
        // Force discovery in this fixture, but exercise real optimization/cache reuse.
        config.optimizeDeps = {
          ...config.optimizeDeps,
          include: [...packageNames],
          noDiscovery: true,
        };
        config.server = { middlewareMode: true, watch: null, ws: false };
        const server = await createServer(config);
        try {
          await server.transformRequest('/main.js');
          const optimizer = server.environments.client?.depsOptimizer;
          if (!optimizer) {
            throw new Error('Expected the client dependency optimizer');
          }
          await expect
            .poll(() => Object.keys(optimizer.metadata.optimized).sort(), { timeout: 10_000 })
            .toEqual([...packageNames].sort());
          const metadata = optimizer.metadata;
          const code = (
            await Promise.all(
              [...Object.values(metadata.optimized), ...Object.values(metadata.chunks)].map((dep) =>
                readFile(dep.file, 'utf8'),
              ),
            )
          ).join('\n');
          return code;
        } finally {
          await server.close();
        }
      }
      const enabledCode = await optimizeFixture();
      expect(enabledCode).toContain('enabled-audio-backend');
      for (const name of Object.values(selected).filter((binding) => binding !== 'audio')) {
        expect(enabledCode).toContain(`selected-${name}`);
      }
      expect(enabledCode).not.toMatch(
        /from ["']#(?:adapter|assets|definition|audio|stats|sound-control|endcard-trigger)/,
      );
      // Restart against the same cache, then change the selected bindings.
      expect(await optimizeFixture()).toBe(enabledCode);
      aliases['#audio'] = disabled;
      aliases['#stats'] = disabled;
      const disabledCode = await optimizeFixture();
      expect(disabledCode).toContain('disabled-audio-backend');
      expect(disabledCode).toContain('disabled-stats');
      expect(disabledCode).not.toContain('enabled-audio-backend');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  },
  30_000,
);
