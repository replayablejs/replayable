import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildAssets } from '@replayablejs/assets';
import { defineConfig } from '@replayablejs/config';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { buildProject } from '../src/production/build-project.js';
import { buildVariant } from '../src/production/build-variant.js';

vi.mock(import('@replayablejs/assets'), async (importOriginal) => ({
  ...(await importOriginal()),
  buildAssets: vi.fn<typeof buildAssets>(),
}));
vi.mock('../src/production/build-variant.js', () => ({
  buildVariant: vi.fn<typeof buildVariant>(),
}));

const config = defineConfig({
  name: 'build-test',
  assets: {
    sourceDir: 'assets',
    outDir: 'generated/resources',
    assets: {},
    emit: { assets: 'generated/assets.ts' },
  },
  localization: { fallback: 'en', languages: ['en', 'hy'] },
  screen: {
    orientations: {
      portrait: { enabled: true, width: 700, height: 1400, ratio: { min: 0.46, max: 0.76 } },
      landscape: { enabled: true, width: 1400, height: 700, ratio: { min: 1.32, max: 2.18 } },
    },
    resolution: {
      pixelRatio: { min: 1, max: 2 },
      renderScale: { minimal: 0.55, reduced: 0.65, balanced: 0.85, full: 1 },
    },
  },
  store: {
    androidUrl: 'https://play.google.com/store/apps/details?id=com.example.game',
    iosUrl: 'https://apps.apple.com/app/id123456789',
  },
});

let project: string;

beforeEach(async () => {
  vi.resetAllMocks();
  project = await mkdtemp(join(tmpdir(), 'replayable-build-'));
});

afterEach(async () => {
  await rm(project, { recursive: true, force: true });
});

it('builds variants sequentially and restores the documented first-variant baseline', async () => {
  await buildProject(config, project);
  expect(
    vi.mocked(buildVariant).mock.calls.map(([variant]) => variant.localization.language),
  ).toEqual(['en', 'hy']);
  expect(buildAssets).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ localization: { language: 'en', fallback: 'en' } }),
    project,
  );
});

it('preserves the original build error when restoration succeeds', async () => {
  const failure = new Error('bundle failed');
  vi.mocked(buildVariant).mockRejectedValueOnce(failure);
  await expect(buildProject(config, project)).rejects.toBe(failure);
  expect(buildAssets).toHaveBeenCalledOnce();
});

it('reports restoration failure after a successful build', async () => {
  const failure = new Error('restoration failed');
  vi.mocked(buildAssets).mockRejectedValueOnce(failure);
  await expect(buildProject(config, project)).rejects.toBe(failure);
});

it('preserves both failures in build-then-restoration order', async () => {
  const buildFailure = new Error('bundle failed');
  const restoreFailure = new Error('restoration failed');
  vi.mocked(buildVariant).mockRejectedValueOnce(buildFailure);
  vi.mocked(buildAssets).mockRejectedValueOnce(restoreFailure);
  await expect(buildProject(config, project)).rejects.toMatchObject({
    name: 'AggregateError',
    errors: [buildFailure, restoreFailure],
  });
});
