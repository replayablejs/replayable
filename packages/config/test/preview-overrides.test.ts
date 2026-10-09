import { expect, it } from 'vitest';

import {
  createPreviewVariant,
  createVariants,
  defineConfig,
  previewOverridesSchema,
} from '../src/index.js';
import { config as base } from './fixtures/preview-config.js';

const config = defineConfig({
  ...base,
  localization: { fallback: 'en', languages: ['en', 'hy'] },
  params: {
    speed: {
      type: 'number',
      default: 1,
      description: 'Speed',
      range: { min: 0, max: 10, step: 1 },
    },
    theme: { type: 'string', default: 'day', description: 'Theme', options: ['day', 'night'] },
    tutorial: { type: 'boolean', default: true, description: 'Tutorial' },
  },
  versions: { default: {}, alternate: { params: { speed: 2 } } },
  networks: { preview: { params: { speed: 3 } }, meta: {} },
  devtools: { stats: { fps: false }, soundControl: true, endCardTrigger: true },
});

it('applies preview values last without mutating project or production variants', () => {
  const before = structuredClone(config);
  const variant = createPreviewVariant(config, {
    version: 'alternate',
    language: 'hy',
    params: { speed: 4, tutorial: false },
    controls: { persistentCta: false },
    devtools: { soundControl: false },
  });
  expect(variant.id).toBe('alternate/preview/hy');
  expect(variant.params).toEqual({ speed: 4, theme: 'day', tutorial: false });
  expect(variant.controls.persistentCta).toBe(false);
  expect(variant.devtools.soundControl).toBe(false);
  expect(variant.devtools.endCardTrigger).toBe(true);
  expect(variant.devtools.stats).toEqual(config.devtools.stats);
  expect(config).toEqual(before);
  expect(createVariants(config).find((item) => item.id === 'alternate/meta/en')?.params.speed).toBe(
    2,
  );
});

it('omitted fields preserve configured values', () => {
  expect(previewOverridesSchema.parse({})).toEqual({});
  expect(previewOverridesSchema.parse({ devtools: {} })).toEqual({ devtools: {} });
  expect(createPreviewVariant(config, {})).toEqual(createVariants(config)[0]);
});

it('stats accepts standard shorthand and replaces the setting as a unit', () => {
  expect(createPreviewVariant(config, { devtools: { stats: false } }).devtools.stats).toBe(false);
  expect(createPreviewVariant(config, { devtools: { stats: true } }).devtools.stats).toMatchObject({
    fps: true,
  });
  expect(
    createPreviewVariant(config, { devtools: { stats: { display: 'compact' } } }).devtools.stats,
  ).toMatchObject({ display: 'compact', fps: true });
});

it.each([
  { missing: 1 },
  { speed: 11 },
  { speed: 1.5 },
  { speed: 'fast' },
  { theme: 'unknown' },
  { tutorial: 1 },
])('rejects invalid params %j', (params) => {
  expect(() => createPreviewVariant(config, { params })).toThrow(/parameter/);
});

it.each([{ version: 'missing' }, { language: 'fr' }])(
  'rejects unknown selections %j',
  (overrides) => {
    expect(() => createPreviewVariant(config, overrides)).toThrow('No configured playable variant');
  },
);

it('does not enable an unconfigured preview network', () => {
  expect(() => createPreviewVariant({ ...config, networks: { meta: {} } })).toThrow(
    'No configured playable variant',
  );
});

it.each([
  null,
  [],
  { network: 'meta' },
  { entry: 'other.ts' },
  { controls: { unknown: true } },
  { devtools: { unknown: true } },
])('rejects unsupported input %j', (input) => {
  expect(previewOverridesSchema.safeParse(input).success).toBe(false);
});
