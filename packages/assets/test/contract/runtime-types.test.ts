import { describe, expect, expectTypeOf, it } from 'vitest';

import type { Assets, JsonObject, LocaleAsset, LocaleDictionary } from '../../src/index.js';

describe('runtime asset types', () => {
  it('represent every emitted category shape', () => {
    const atlasLayout = {
      frames: {
        button: {
          frame: { h: 64, w: 128, x: 0, y: 0 },
          rotated: false,
        },
      },
      meta: { scale: '1' },
    } as const satisfies JsonObject;
    const spineSkeleton = {
      animations: { idle: {} },
      bones: [{ name: 'root' }],
    } as const satisfies JsonObject;

    const assets = {
      primary: {
        atlases: {
          interface: { image: '/interface.webp', json: atlasLayout },
        },
        fonts: {
          interface: { family: 'Replayable UI', src: '/interface.woff2' },
        },
        locales: {
          interface: { install: 'Install', play: 'Play' },
        },
        shaders: {
          glow: { frag: '/glow/frag.glsl', vert: '/glow/vert.glsl' },
        },
        sounds: {
          click: '/click.m4a',
        },
        spines: {
          hero: {
            atlas: '/hero/atlas.atlas',
            format: 'json',
            images: ['/hero/page0.webp'],
            scale: 0.5,
            skel: spineSkeleton,
          },
        },
        sprites: {
          logo: { scale: 1, src: '/logo.avif' },
        },
        textures: {
          surface: { scale: 1, src: '/surface.png' },
        },
      },
      secondary: {
        spines: {
          raptor: {
            atlas: '/raptor/atlas.atlas',
            format: 'skel',
            images: ['/raptor/page0.webp'],
            scale: 1,
            skel: '/raptor/skeleton.skel',
          },
        },
      },
    } as const satisfies Assets;

    expectTypeOf<LocaleAsset>().toEqualTypeOf<LocaleDictionary | string>();
    expectTypeOf<LocaleDictionary[string]>().toEqualTypeOf<string>();
    expect(assets.primary.atlases.interface.json).toBe(atlasLayout);
    expect(assets.primary.spines.hero.skel).toBe(spineSkeleton);
    expect(assets.primary.spines.hero.format).toBe('json');
    expect(assets.secondary.spines.raptor.skel).toBe('/raptor/skeleton.skel');
    expect(assets.secondary.spines.raptor.format).toBe('skel');
  });

  it('rejects non-string translation values', () => {
    const invalidLocale = {
      // @ts-expect-error Generated locale translations are always strings.
      play: ['Play'],
    } satisfies LocaleDictionary;

    expect(invalidLocale.play).toEqual(['Play']);
  });
});
