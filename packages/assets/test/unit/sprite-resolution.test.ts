import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveSprites } from '#resolvers/categories/sprite.js';
import type { AssetConfig } from '#types/config.js';
import type { ResolutionContext } from '#types/resolution.js';
import type { SourceFile } from '#types/source.js';

import { config } from '../support/config.js';

describe('sprite resolver', () => {
  it('owns only the sprite directory and applies the rule belonging to the selected locale', () => {
    const assetConfig = config({
      assets: {
        sprites: [{ options: { scale: 0.5 } }, { match: 'logo.hy.png', options: { scale: 0.75 } }],
      },
      localization: { fallback: 'en', language: 'hy' },
    });
    const assets = resolveSprites(
      resolutionContext(assetConfig, [
        'sprites/logo.en.png',
        'textures/ignored.png',
        'sprites/background.png',
        'sprites/logo.png',
        'sprites/badge.en.png',
        'sprites/logo.hy.png',
        'sprites/logo.fr.png',
      ]),
    );

    expect(assets.map((asset) => asset.relativePath)).toEqual([
      'sprites/background.png',
      'sprites/badge.png',
      'sprites/logo.png',
    ]);
    expect(assets.map((asset) => asset.absolutePath)).toEqual([
      resolve(projectRoot, 'assets/source/sprites/background.png'),
      resolve(projectRoot, 'assets/source/sprites/badge.en.png'),
      resolve(projectRoot, 'assets/source/sprites/logo.hy.png'),
    ]);
    expect(assets.map((asset) => asset.options.scale)).toEqual([0.5, 0.5, 0.75]);
  });

  it('uses canonical paths for final exclusions and physical paths for rule exclusions', () => {
    const assetConfig = config({
      assets: {
        sprites: [
          {
            exclude: ['badge.hy.png'],
          },
        ],
      },
      exclude: ['sprites/logo.png'],
      localization: { fallback: 'en', language: 'hy' },
    });
    const assets = resolveSprites(
      resolutionContext(assetConfig, [
        'sprites/logo.png',
        'sprites/logo.en.png',
        'sprites/logo.hy.png',
        'sprites/badge.en.png',
        'sprites/badge.hy.png',
      ]),
    );

    expect(assets.map((asset) => asset.relativePath)).toEqual(['sprites/badge.png']);
    expect(assets[0]?.absolutePath).toBe(
      resolve(projectRoot, 'assets/source/sprites/badge.en.png'),
    );
  });
});

const projectRoot = resolve('/project');
const sourceRoot = resolve(projectRoot, 'assets/source');

function resolutionContext(
  assetConfig: AssetConfig,
  relativePaths: readonly string[],
): ResolutionContext {
  return {
    config: assetConfig,
    files: relativePaths.map(sourceFile),
    outputRoot: resolve(projectRoot, 'assets/generated'),
  };
}

function sourceFile(relativePath: string): SourceFile {
  return {
    absolutePath: resolve(sourceRoot, relativePath),
    relativePath,
  };
}
