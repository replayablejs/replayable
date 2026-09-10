import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

import { renderImageEntry } from '#emitters/categories/image.js';
import { renderRegistryObject } from '#emitters/utils/object-literal.js';
import type { RegistryObject } from '#types/emission.js';

describe('generated object keys', () => {
  it('preserves prototype-named image IDs as own properties', () => {
    const entry = renderImageEntry(
      {
        category: 'sprites',
        bundle: 'primary',
        id: '__proto__',
        file: { path: '/generated/logo.webp', format: 'webp' },
        runtime: { scale: 1 },
      },
      { fromDirectory: '/generated', imports: [] },
    );
    const result: unknown = runInNewContext(`const image_0 = 'url'; ({${entry}})`);
    expect(result).toEqual({ ['__proto__']: { src: 'url', scale: 1 } });
  });

  it('preserves special names and escaped strings at every registry level', () => {
    const registry: RegistryObject = {
      ['__proto__']: { ['__proto__']: '__proto__', 'quote"\n': 'line\n"quoted"' },
      constructor: 'constructor',
    };
    const result: unknown = runInNewContext(`(${renderRegistryObject(registry)})`);
    expect(result).toEqual(registry);
  });
});
