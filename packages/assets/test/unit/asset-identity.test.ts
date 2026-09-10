import { describe, expect, it } from 'vitest';

import { assertUniqueRuntimeAssetIds, createAtlasSheetId } from '#pipeline/asset-identity.js';
import type { ProcessedAtlasAsset, ProcessedImageAsset } from '#types/processed-assets.js';

type ProcessedSpriteAsset = Extract<ProcessedImageAsset, { readonly category: 'sprites' }>;

describe('asset identity', () => {
  it('preserves an atlas directory when creating a generated sheet ID', () => {
    expect(createAtlasSheetId('ui/menu', 'menu-0')).toBe('ui/menu-0');
    expect(createAtlasSheetId('menu', 'menu-0')).toBe('menu-0');
  });

  it('rejects duplicate runtime IDs regardless of selected file format', () => {
    expect(() =>
      assertUniqueRuntimeAssetIds([sprite('logo', 'avif'), sprite('logo', 'webp')]),
    ).toThrow('Duplicate runtime asset ID: primary:sprites:logo');
  });

  it('allows the same ID in different bundles', () => {
    expect(() =>
      assertUniqueRuntimeAssetIds([
        sprite('logo', 'avif'),
        { ...sprite('logo', 'webp'), bundle: 'secondary' },
      ]),
    ).not.toThrow();
  });

  it('allows the same ID in different categories', () => {
    expect(() =>
      assertUniqueRuntimeAssetIds([
        sprite('logo', 'avif'),
        { ...sprite('logo', 'webp'), category: 'textures' },
      ]),
    ).not.toThrow();
  });

  it('detects atlas collisions using the final generated sheet ID', () => {
    expect(() => assertUniqueRuntimeAssetIds([atlas('ui/menu-0'), atlas('ui/menu-0')])).toThrow(
      'Duplicate runtime asset ID: primary:atlases:ui/menu-0',
    );
  });
});

function sprite(id: string, format: ProcessedSpriteAsset['file']['format']): ProcessedSpriteAsset {
  return {
    bundle: 'primary',
    category: 'sprites',
    file: {
      format,
      path: `/generated/${id}.${format}`,
    },
    id,
    runtime: { scale: 1 },
  };
}

function atlas(id: string): ProcessedAtlasAsset {
  return {
    bundle: 'primary',
    category: 'atlases',
    files: {
      image: { format: 'webp', path: `/generated/${id}.webp` },
      json: { format: 'json', path: `/generated/${id}.json` },
    },
    frameNames: [],
    id,
  };
}
