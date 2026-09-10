import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import { loadPixiSpine } from '../src/spine/loader/load-pixi-spine.js';

const spine = vi.hoisted(() => ({
  atlasPageCount: 1,
  binaryResult: { format: 'skel' },
  binaryRead: vi.fn<(source: Uint8Array) => object>(),
  fromTextureSource: vi.fn<(source: object) => object>(),
  jsonResult: { format: 'json' },
  jsonRead: vi.fn<(source: object) => object>(),
  pages: [] as { setTexture: Mock<(texture: object) => void> }[],
}));

const pixi = vi.hoisted(() => ({
  load: vi.fn<(source: string) => Promise<unknown>>(),
}));

vi.mock('@esotericsoftware/spine-pixi-v8', () => ({
  AtlasAttachmentLoader: class {
    readonly mocked = true;
  },
  SkeletonBinary: class {
    readSkeletonData = spine.binaryRead;
  },
  SkeletonJson: class {
    readSkeletonData = spine.jsonRead;
  },
  SpineTexture: { from: spine.fromTextureSource },
  TextureAtlas: class {
    readonly pages = Array.from({ length: spine.atlasPageCount }, () => ({
      setTexture: vi.fn<(texture: object) => void>(),
    }));

    constructor() {
      spine.pages = this.pages;
    }
  },
}));

vi.mock('pixi.js', () => ({
  Assets: { load: pixi.load },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  spine.atlasPageCount = 1;
  spine.binaryRead.mockReturnValue(spine.binaryResult);
  spine.fromTextureSource.mockImplementation((source) => ({ source }));
  spine.jsonRead.mockReturnValue(spine.jsonResult);
});

describe('Pixi Spine asset loader', () => {
  it('parses inline JSON and binds scaled textures in atlas-page order', async () => {
    const textures = [createTexture(), createTexture()];
    spine.atlasPageCount = 2;
    pixi.load.mockImplementation(async (source) => textures[source === 'page-a.png' ? 0 : 1]);
    const skeleton = { skeleton: { spine: '4.3' } };

    const loaded = await loadPixiSpine({
      assetMode: 'inline',
      category: 'spines',
      id: 'hero',
      source: {
        atlas: 'inline atlas',
        format: 'json',
        images: ['page-a.png', 'page-b.png'],
        scale: 2,
        skel: skeleton,
      },
    });

    expect(pixi.load.mock.calls).toEqual([['page-a.png'], ['page-b.png']]);
    expect(textures[0]?.source.resolution).toBe(2);
    expect(textures[1]?.source.resolution).toBe(2);
    expect(textures[0]?.update).toHaveBeenCalledOnce();
    expect(textures[1]?.update).toHaveBeenCalledOnce();
    expect(spine.pages[0]?.setTexture).toHaveBeenCalledWith({ source: textures[0]?.source });
    expect(spine.pages[1]?.setTexture).toHaveBeenCalledWith({ source: textures[1]?.source });
    expect(spine.jsonRead).toHaveBeenCalledWith(skeleton);
    expect(loaded).toBe(spine.jsonResult);
  });

  it('fetches and parses resource JSON', async () => {
    pixi.load.mockResolvedValue(createTexture());
    const skeleton = { skeleton: { spine: '4.3' } };
    const fetchResource = vi.fn<(source: string | URL | Request) => Promise<Response>>(
      async (source) => {
        if (source === 'hero.atlas') {
          return new Response('resource atlas');
        }

        return Response.json(skeleton);
      },
    );
    vi.stubGlobal('fetch', fetchResource);

    await loadPixiSpine({
      assetMode: 'resource',
      category: 'spines',
      id: 'hero',
      source: {
        atlas: 'hero.atlas',
        format: 'json',
        images: ['hero.png'],
        scale: 1,
        skel: 'hero.json',
      },
    });

    expect(fetchResource.mock.calls.map(([source]) => source)).toEqual(['hero.atlas', 'hero.json']);
    expect(spine.jsonRead).toHaveBeenCalledWith(skeleton);
  });

  it('decodes inline binary bytes without fetch under a restrictive connect-src policy', async () => {
    pixi.load.mockResolvedValue(createTexture());
    const bytes = Uint8Array.from([0, 1, 127, 128, 255]);
    const fetchResource = vi.fn<typeof fetch>(() => {
      throw new Error('CSP blocked fetch');
    });
    vi.stubGlobal('fetch', fetchResource);

    const loaded = await loadPixiSpine({
      assetMode: 'inline',
      category: 'spines',
      id: 'hero',
      source: {
        atlas: 'inline atlas',
        format: 'skel',
        images: ['hero.png'],
        scale: 1,
        skel: 'data:application/octet-stream;base64,AAF/gP8=',
      },
    });

    expect(spine.binaryRead).toHaveBeenCalledWith(bytes);
    expect(spine.jsonRead).not.toHaveBeenCalled();
    expect(loaded).toBe(spine.binaryResult);
    expect(fetchResource).not.toHaveBeenCalled();
  });

  it('still fetches external binary skeletons and atlas text', async () => {
    pixi.load.mockResolvedValue(createTexture());
    const bytes = Uint8Array.from([0, 128, 255]);
    const fetchResource = vi.fn<(source: string) => Promise<Response>>(
      async (source: string) => new Response(source === 'hero.atlas' ? 'resource atlas' : bytes),
    );
    vi.stubGlobal('fetch', fetchResource);

    await loadPixiSpine({
      assetMode: 'resource',
      category: 'spines',
      id: 'hero',
      source: {
        atlas: 'hero.atlas',
        format: 'skel',
        images: ['hero.png'],
        scale: 1,
        skel: 'hero.skel',
      },
    });

    expect(fetchResource.mock.calls.map(([source]) => source)).toEqual(['hero.atlas', 'hero.skel']);
    expect(spine.binaryRead).toHaveBeenCalledWith(bytes);
  });

  it.each([
    'data:application/octet-stream',
    'data:application/octet-stream,bytes',
    'data:application/octet-stream;base64,%%%',
  ])('rejects malformed inline binary %s without fetching', async (skel) => {
    pixi.load.mockResolvedValue(createTexture());
    const fetchResource = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchResource);
    await expect(
      loadPixiSpine({
        assetMode: 'inline',
        category: 'spines',
        id: 'hero',
        source: { atlas: 'inline atlas', format: 'skel', images: ['hero.png'], scale: 1, skel },
      }),
    ).rejects.toThrow('Failed to load Replayable Spine asset "hero".');
    expect(fetchResource).not.toHaveBeenCalled();
    expect(spine.binaryRead).not.toHaveBeenCalled();
  });

  it('rejects an atlas whose page and image counts differ', async () => {
    spine.atlasPageCount = 2;
    pixi.load.mockResolvedValue(createTexture());

    await expect(
      loadPixiSpine({
        assetMode: 'inline',
        category: 'spines',
        id: 'hero',
        source: {
          atlas: 'inline atlas',
          format: 'json',
          images: ['hero.png'],
          scale: 1,
          skel: {},
        },
      }),
    ).rejects.toThrow('Failed to load Replayable Spine asset "hero".');
  });
});

function createTexture() {
  return {
    source: { resolution: 1 },
    update: vi.fn<() => void>(),
  };
}
