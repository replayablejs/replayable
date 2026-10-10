import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  applyProjectData,
  createPreviewVariant,
  createVariants,
  defineConfig,
  projectDataSchema,
} from '../src/index.js';
import { config as base } from './fixtures/preview-config.js';

const config = defineConfig({
  ...base,
  params: {
    speed: {
      type: 'number',
      default: 1,
      description: 'Speed',
      range: { min: 0, max: 10, step: 1 },
    },
  },
  versions: {
    original: {
      params: { speed: 2 },
      assets: { exclude: ['old/**'], bundles: { secondary: { include: ['sounds/**'] } } },
      completion: { duration: 30 },
    },
  },
  networks: { preview: { params: { speed: 4 } }, meta: {} },
  devtools: { soundControl: false, stats: { fps: false } },
});

it('merges saved fields without mutating defaults, then applies network and temporary values', () => {
  const before = structuredClone(config);
  const merged = applyProjectData(config, {
    schemaVersion: 1,
    versions: {
      original: { params: { speed: 3 }, assets: { bundles: {} }, completion: { inactivity: 5 } },
    },
    controls: { persistentCta: false },
    devtools: { endCardTrigger: true },
  });
  expect(merged.versions.original).toEqual({
    params: { speed: 3 },
    assets: { exclude: ['old/**'], bundles: {} },
    completion: { duration: 30, inactivity: 5 },
  });
  expect(merged.devtools.stats).toEqual(config.devtools.stats);
  expect(merged.devtools.soundControl).toBe(false);
  expect(merged.controls.persistentCta).toBe(false);
  expect(createVariants(merged).find((variant) => variant.network === 'meta')?.params.speed).toBe(
    3,
  );
  expect(createPreviewVariant(merged).params.speed).toBe(4);
  expect(createPreviewVariant(merged, { params: { speed: 5 } }).params.speed).toBe(5);
  expect(config).toEqual(before);
});

it('copies evaluated version values through JSON while inheriting project defaults', () => {
  const copy = JSON.parse(JSON.stringify(config.versions.original));
  const data = projectDataSchema.parse({ schemaVersion: 1, versions: { copied: copy, empty: {} } });
  const changed = defineConfig({
    ...config,
    versions: { original: { assets: { exclude: ['changed/**'] } } },
  });
  const merged = applyProjectData(changed, data);
  expect(merged.versions.copied?.assets).toEqual(config.versions.original?.assets);
  expect(
    createVariants(merged).find((variant) => variant.id === 'empty/meta/en')?.params.speed,
  ).toBe(1);
});

it('replaces arrays and stats without deleting omitted settings', () => {
  const merged = applyProjectData(config, {
    schemaVersion: 1,
    versions: { original: { assets: { exclude: [] } } },
    devtools: { stats: false },
  });
  expect(merged.versions.original?.assets).toEqual({
    exclude: [],
    bundles: config.versions.original?.assets?.bundles,
  });
  expect(merged.devtools.stats).toBe(false);
  expect(merged.devtools.soundControl).toBe(false);
  expect(applyProjectData(config, { schemaVersion: 1 })).toEqual(config);
});

it.each([
  { schemaVersion: 2 },
  { schemaVersion: 1, entry: 'other.ts' },
  { schemaVersion: 1, versions: { original: { params: { missing: 1 } } } },
  { schemaVersion: 1, versions: { original: { params: { speed: 11 } } } },
  { schemaVersion: 1, versions: { original: { params: { speed: 'fast' } } } },
  { schemaVersion: 1, versions: { original: {}, ' original ': {} } },
])('rejects invalid saved data %j', (data) => {
  expect(() => applyProjectData(config, projectDataSchema.parse(data))).toThrow(ZodError);
});
