import { describe, expect, it } from 'vitest';

import { assetConfigSchema, type ImageAssetOptions } from '../../src/index.js';
import { config } from '../support/config.js';

describe('asset configuration', () => {
  it('keeps lossless image options aligned between TypeScript and runtime validation', () => {
    const losslessOptions = { lossless: true, scale: 1 } satisfies ImageAssetOptions;
    const lossyOptions = { quality: 70, scale: 1 } satisfies ImageAssetOptions;
    // @ts-expect-error Lossless output does not expose lossy encoder quality.
    const invalidOptions = { lossless: true, quality: 70, scale: 1 } satisfies ImageAssetOptions;
    const parsedLossless = assetConfigSchema.safeParse({
      ...config(),
      assets: {
        textures: [{ options: invalidOptions }],
      },
    });

    expect(losslessOptions.lossless).toBe(true);
    expect(lossyOptions.quality).toBe(70);
    expect(parsedLossless.success).toBe(false);
  });

  it('rejects unknown fields at every configuration boundary', () => {
    const invalidConfigurations: ReadonlyArray<readonly [string, unknown]> = [
      ['root', { ...config(), outputDir: 'assets/out' }],
      [
        'localization',
        { ...config(), localization: { fallback: 'en', language: 'en', region: 'US' } },
      ],
      [
        'secondary bundle',
        {
          ...config(),
          bundles: { secondary: { include: ['sounds/**'], preload: true } },
        },
      ],
      [
        'emission',
        {
          ...config(),
          emit: { assets: 'src/assets/assets.ts', manifest: 'manifest.ts' },
        },
      ],
      [
        'legacy asset rule include',
        {
          ...config(),
          assets: { sprites: [{ include: '**' }] },
        },
      ],
      [
        'asset exclusions',
        {
          ...config(),
          exclude: { include: ['intro/**'] },
        },
      ],
      [
        'atlas rule',
        {
          ...config(),
          assets: { atlases: [{ formats: ['png'] }] },
        },
      ],
      [
        'font options',
        {
          ...config(),
          assets: {
            fonts: [
              {
                match: '**/*.ttf',
                options: { family: 'Replayable UI', weight: 700 },
              },
            ],
          },
        },
      ],
      [
        'sound options',
        {
          ...config(),
          assets: { sounds: [{ options: { codec: 'aac' } }] },
        },
      ],
    ];

    const acceptedBoundaries = invalidConfigurations.flatMap(([boundary, invalidConfig]) =>
      assetConfigSchema.safeParse(invalidConfig).success ? [boundary] : [],
    );

    expect(acceptedBoundaries).toEqual([]);
  });

  it('trims meaningful strings and rejects blank paths, patterns, and families', () => {
    const parsed = assetConfigSchema.parse({
      ...config(),
      assets: {
        fonts: [
          {
            match: '  **/*.ttf  ',
            options: { extraCharacters: '$€֏', family: '  Replayable UI  ' },
          },
        ],
      },
      bundles: {
        secondary: {
          exclude: ['  sounds/debug/**  '],
          include: ['  sounds/**  '],
        },
      },
      emit: { assets: '  src/assets/assets.ts  ' },
      exclude: ['  sounds/music/**  '],
      outDir: '  src/assets/resources  ',
      sourceDir: '  assets/source  ',
    });
    const blankValues = [
      { ...config(), sourceDir: '   ' },
      { ...config(), bundles: { secondary: { include: ['   '] } } },
      { ...config(), assets: { sprites: [{ match: '   ' }] } },
      { ...config(), exclude: ['   '] },
      {
        ...config(),
        assets: { fonts: [{ options: { family: '   ' } }] },
      },
    ];

    expect(parsed).toMatchObject({
      bundles: {
        secondary: {
          exclude: ['sounds/debug/**'],
          include: ['sounds/**'],
        },
      },
      emit: { assets: 'src/assets/assets.ts' },
      exclude: ['sounds/music/**'],
      outDir: 'src/assets/resources',
      sourceDir: 'assets/source',
    });
    expect(parsed.assets.fonts[0]).toMatchObject({
      match: '**/*.ttf',
      options: { extraCharacters: '$€֏', family: 'Replayable UI' },
    });

    for (const blankValue of blankValues) {
      expect(assetConfigSchema.safeParse(blankValue).success).toBe(false);
    }
  });

  it('normalizes omitted categories and current processor defaults', () => {
    const parsed = assetConfigSchema.parse({
      ...config(),
      assets: { atlases: [{}] },
    });

    expect(parsed.assets).toMatchObject({
      fonts: [],
      locales: [],
      shaders: [],
      sounds: [],
      spines: [],
      sprites: [],
      textures: [],
    });
    expect(parsed.assets.atlases[0]).toMatchObject({
      match: '**',
      options: { extrude: 0 },
    });
    expect(parsed.bundles).toEqual({});
    expect(parsed.exclude).toEqual([]);
  });

  it('requires an explicit nonblank font family', () => {
    const missingFamily = assetConfigSchema.safeParse({
      ...config(),
      assets: { fonts: [{ match: '**/*.ttf' }] },
    });
    const validFamily = assetConfigSchema.safeParse({
      ...config(),
      assets: {
        fonts: [
          {
            match: '**/*.ttf',
            options: { family: 'Replayable UI' },
          },
        ],
      },
    });

    expect(missingFamily.success).toBe(false);
    expect(validFamily.success).toBe(true);
  });
});
