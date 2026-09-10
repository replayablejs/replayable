import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { optimizeDeps, resolveConfig } from 'vite';
import { expect, it } from 'vitest';

import { createDevelopmentViteConfig } from '../src/vite/create-development-vite-config.js';

it.each(['object', 'array'] as const)(
  'optimizes installed packages with %s aliases and invalidates cached selections',
  async (form) => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'replayable-dev-aliases-'));
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
      async function optimize() {
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
        return optimizeDeps(await resolveConfig(config, 'serve'), false, true);
      }
      async function output(metadata: Awaited<ReturnType<typeof optimize>>) {
        expect(Object.keys(metadata.optimized).sort()).toEqual([...packageNames].sort());
        return (
          await Promise.all(
            [...Object.values(metadata.optimized), ...Object.values(metadata.chunks)].map((dep) =>
              readFile(dep.file, 'utf8'),
            ),
          )
        ).join('\n');
      }
      const enabled = await optimize();
      const enabledCode = await output(enabled);
      expect(enabledCode).toContain('enabled-audio-backend');
      for (const name of Object.values(selected).filter((binding) => binding !== 'audio')) {
        expect(enabledCode).toContain(`selected-${name}`);
      }
      expect(enabledCode).not.toMatch(
        /from ["']#(?:adapter|assets|definition|audio|stats|sound-control|endcard-trigger)/,
      );
      const cached = await optimize();
      expect(cached.hash).toBe(enabled.hash);
      aliases['#audio'] = disabled;
      aliases['#stats'] = disabled;
      const changed = await optimize();
      expect(changed.hash).not.toBe(enabled.hash);
      const disabledCode = await output(changed);
      expect(disabledCode).toContain('disabled-audio-backend');
      expect(disabledCode).toContain('disabled-stats');
      expect(disabledCode).not.toContain('enabled-audio-backend');
    } finally {
      await rm(projectRoot, { recursive: true, force: true });
    }
  },
);
