import { describe, expect, it } from 'vitest';

import { isSupportedSourceFile } from '#resolvers/source-resolution.js';
import type { AssetCategory } from '#types/categories.js';

describe('supported source formats', () => {
  it.each<[AssetCategory, readonly string[]]>([
    ['atlases', ['sheet.avif', 'sheet.jpeg', 'sheet.jpg', 'sheet.png', 'sheet.webp']],
    ['fonts', ['body.otf', 'body.ttf', 'body.woff', 'body.woff2']],
    ['locales', ['interface.json', 'interface.jsonc']],
    ['shaders', ['vert.glsl']],
    ['sounds', ['click.m4a', 'click.mp3', 'click.ogg', 'click.wav']],
    [
      'spines',
      [
        'hero.atlas',
        'hero.avif',
        'hero.jpeg',
        'hero.jpg',
        'hero.json',
        'hero.png',
        'hero.skel',
        'hero.webp',
      ],
    ],
    ['sprites', ['logo.avif', 'logo.jpeg', 'logo.jpg', 'logo.png', 'logo.webp']],
    ['textures', ['normal.avif', 'normal.jpeg', 'normal.jpg', 'normal.png', 'normal.webp']],
  ])('recognizes every %s format without relying on configuration globs', (category, filenames) => {
    for (const filename of filenames) {
      expect(isSupportedSourceFile(category, `${category}/${filename}`)).toBe(true);
    }

    expect(isSupportedSourceFile(category, `${category}/README.md`)).toBe(false);
  });

  it('matches extensions case-insensitively', () => {
    expect(isSupportedSourceFile('sounds', 'sounds/CLICK.WAV')).toBe(true);
  });
});
