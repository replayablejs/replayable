import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveAtlases } from '#resolvers/categories/atlas.js';
import type { AssetConfig } from '#types/config.js';
import type { ResolutionContext } from '#types/resolution.js';
import type { SourceFile } from '#types/source.js';

import { config } from '../support/config.js';

describe('atlas resolver', () => {
  it('groups matched directories in stable order and applies the last matching rule', () => {
    const assetConfig = config({
      assets: {
        atlases: [
          {
            exclude: ['debug'],
            options: { padding: 1 },
          },
          { match: 'ui', options: { padding: 7 } },
        ],
      },
    });
    const assets = resolveAtlases(
      resolutionContext(assetConfig, [
        'atlases/ui/z.png',
        'misc/splash.png',
        'atlases/game/player.webp',
        'atlases/ui/README.md',
        'atlases/debug/grid.png',
        'atlases/ui/a.png',
      ]),
    );

    expect(assets.map((asset) => asset.atlas.id)).toEqual(['game', 'ui']);
    expect(assets[0]?.atlas.images).toEqual([
      resolve(projectRoot, 'assets/source/atlases/game/player.webp'),
    ]);
    expect(assets[1]?.atlas.images).toEqual([
      resolve(projectRoot, 'assets/source/atlases/ui/a.png'),
      resolve(projectRoot, 'assets/source/atlases/ui/z.png'),
    ]);
    expect(assets[0]?.options.padding).toBe(1);
    expect(assets[1]?.options.padding).toBe(7);
  });

  it('matches rules against the logical directory rather than its filenames', () => {
    const assetConfig = config({
      assets: { atlases: [{ match: 'ui/*.png' }] },
    });
    const assets = resolveAtlases(resolutionContext(assetConfig, ['atlases/ui/button.png']));

    expect(assets).toEqual([]);
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
