import { Texture } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadPixiAtlas } from '../src/loader/load-pixi-atlas.js';
import { loadPixiSprite } from '../src/loader/load-pixi-sprite.js';

const pixi = vi.hoisted(() => ({
  cacheSet: vi.fn<(id: string, value: unknown) => void>(),
  load: vi.fn<(source: unknown) => Promise<unknown>>(),
  parse: vi.fn<() => Promise<void>>(),
}));

vi.mock('pixi.js', () => ({
  Assets: { cache: { set: pixi.cacheSet }, load: pixi.load },
  Spritesheet: class {
    parse = pixi.parse;
  },
  Texture: class {
    readonly mocked = true;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Pixi asset loaders', () => {
  it('applies the authored source scale to sprites', async () => {
    const texture = {
      source: { resolution: 1 },
      update: vi.fn<() => void>(),
    };
    pixi.load.mockResolvedValue(texture);

    const loaded = await loadPixiSprite({
      assetMode: 'resource',
      category: 'sprites',
      id: 'flower',
      source: { scale: 2, src: 'flower.png' },
    });

    expect(pixi.load).toHaveBeenCalledWith({ alias: 'flower', src: 'flower.png' });
    expect(texture.source.resolution).toBe(2);
    expect(texture.update).toHaveBeenCalledOnce();
    expect(loaded).toBe(texture);
  });

  it('parses and caches atlases after loading their texture', async () => {
    const texture = new Texture();
    pixi.load.mockResolvedValue(texture);

    const atlas = await loadPixiAtlas({
      assetMode: 'resource',
      category: 'atlases',
      id: 'garden',
      source: {
        image: 'garden.png',
        json: { frames: {}, meta: {} },
      },
    });

    expect(pixi.load).toHaveBeenCalledWith('garden.png');
    expect(pixi.parse).toHaveBeenCalledOnce();
    expect(pixi.cacheSet).toHaveBeenCalledWith('garden', atlas);
  });
});
