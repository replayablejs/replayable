import { mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { build } from 'vite';
import { expect, it, onTestFinished } from 'vitest';

import { createGeneratedAssetsPlugin } from '../src/vite/plugins/generated-assets.js';

const bytes = Buffer.from('glTF binary fixture');

async function buildModel(mode: 'inline' | 'resource'): Promise<{ root: string; code: string }> {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'replayable-model-bundle-')));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  // Vite's responsibility is preserving binary bytes, independent of model parsing.
  const assetsModule = join(root, 'assets.ts');
  await writeFile(join(root, 'car.glb'), bytes);
  await writeFile(
    assetsModule,
    'import src from "./car.glb"; console.log({ models: { car: { src, compression: "none" } } });',
  );
  await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [createGeneratedAssetsPlugin({ assetsModule, mode })],
    build: {
      outDir: 'dist',
      minify: false,
      rolldownOptions: { input: assetsModule, output: { entryFileNames: 'entry.js' } },
    },
  });
  return { root, code: await readFile(join(root, 'dist/entry.js'), 'utf8') };
}

it('embeds model bytes without external files in inline mode', async () => {
  const { root, code } = await buildModel('inline');
  expect(code).toContain(`base64,${bytes.toString('base64')}`);
  expect(await readdir(join(root, 'dist'))).toEqual(['entry.js']);
});

it('emits model bytes and their URL in resource mode', async () => {
  const { root, code } = await buildModel('resource');
  const files = await readdir(join(root, 'dist/assets'));
  const file = files.find((name) => name.endsWith('.glb'));
  expect(file).toBeDefined();
  expect(code).not.toContain('base64,');
  expect(await readFile(join(root, 'dist/assets', file ?? 'missing'))).toEqual(bytes);
});
