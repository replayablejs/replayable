import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';

import { type ExportFilename, createVariants, defineConfig } from '@replayablejs/config';
import { expect, it, onTestFinished } from 'vitest';

import { resolveExportProject } from '../src/resolution/resolve-export-project.js';

const assets = {
  sourceDir: 'assets',
  outDir: 'src/assets/resources',
  assets: {},
  emit: { assets: 'src/assets/assets.ts' },
};
const store = {
  androidUrl: 'https://play.google.com/store/apps/details?id=com.example.game',
  iosUrl: 'https://apps.apple.com/app/id123456789',
};
const screen = {
  orientations: {
    portrait: {
      enabled: true,
      width: 700,
      height: 1400,
      ratio: { min: 0.46, max: 0.76 },
    },
    landscape: {
      enabled: true,
      width: 1400,
      height: 700,
      ratio: { min: 0.46, max: 0.76 },
    },
  },
  resolution: {
    pixelRatio: { min: 1, max: 2 },
    renderScale: { minimal: 0.55, reduced: 0.65, balanced: 0.85, full: 1 },
  },
};

async function resolveNames(filename?: string | ExportFilename) {
  const projectRoot = await mkdtemp(join(tmpdir(), 'replayable-export-names-'));
  onTestFinished(() => rm(projectRoot, { recursive: true, force: true }));
  const config = defineConfig({
    assets,
    screen,
    store,
    name: 'City Builder',
    localization: { fallback: 'en', languages: ['en'] },
    networks: { meta: {}, google: {}, preview: {} },
    ...(filename === undefined ? {} : { export: { filename } }),
  });
  for (const variant of createVariants(config)) {
    const directory = join(projectRoot, 'dist', variant.id);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'index.html'), '<!doctype html>');
  }
  const result = await resolveExportProject(config, { projectRoot });
  return result.variants.map(({ outputFile }) => basename(outputFile)).sort();
}

it('preserves default names and network extensions', async () => {
  expect(await resolveNames()).toEqual([
    'google_default_en.zip',
    'meta_default_en.html',
    'preview_default_en.html',
  ]);
});

it('expands branding and reordered placeholders and normalizes punctuation', async () => {
  expect(await resolveNames('Campaign 42-{name}-{language}-{version}-{network}')).toEqual([
    'campaign_42_city_builder_en_default_google.zip',
    'campaign_42_city_builder_en_default_meta.html',
    'campaign_42_city_builder_en_default_preview.html',
  ]);
});

it('rejects templates that collapse variants to the same output file', async () => {
  await expect(resolveNames('{name}')).rejects.toThrow('resolve to the same output file');
});

it('preserves callback output and supplies raw variant values', async () => {
  expect(
    await resolveNames(
      ({ name, version, network, language }) => `${name}-${version}-${network}-${language}`,
    ),
  ).toEqual([
    'City Builder-default-google-en.zip',
    'City Builder-default-meta-en.html',
    'City Builder-default-preview-en.html',
  ]);
});

it.each([
  '',
  '  ',
  '../escape',
  'folder\\name',
  'bad:name',
  'bad\u0000name',
  '.',
  '..',
  'name.',
  'name ',
  'name.HTML',
  'name.zip',
])('rejects invalid callback output %j', async (name) => {
  await expect(resolveNames(() => name)).rejects.toThrow(/Export filename callback/u);
});

it('rejects non-string and asynchronous callback results', async () => {
  for (const value of [undefined, 42, Promise.resolve('name')]) {
    // @ts-expect-error Exercise invalid results from untyped JavaScript callbacks.
    await expect(resolveNames(() => value)).rejects.toThrow(/non-empty string/u);
  }
});

it('checks collisions for callback filenames', async () => {
  await expect(resolveNames(() => 'Same Name')).rejects.toThrow('resolve to the same output file');
});
