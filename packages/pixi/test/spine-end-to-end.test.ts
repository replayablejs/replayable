/// <reference types="node" />

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Assets, Texture, Ticker } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixtures = vi.hoisted(() => ({
  spines: {} as Record<string, unknown>,
}));

vi.mock('@replayablejs/runtime', () => ({
  playable: { loader: { cache: { spines: fixtures.spines } } },
}));

import { createSpine } from '../src/spine/factories/create-spine.js';
import { loadPixiSpine } from '../src/spine/loader/load-pixi-spine.js';

const spineboyDirectory = resolve(
  import.meta.dirname,
  '../../../examples/basic-assets/assets/spines/spineboy',
);
const raptorDirectory = resolve(
  import.meta.dirname,
  '../../../examples/basic-assets/assets/spines/raptor',
);

beforeEach(() => {
  Ticker.shared.autoStart = false;
  Ticker.shared.stop();

  for (const id of Object.keys(fixtures.spines)) {
    delete fixtures.spines[id];
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Pixi Spine integration', () => {
  it('loads a real Spine 4.3 export and creates an animated display object', async () => {
    const [atlas, skeletonSource] = await Promise.all([
      readFile(resolve(spineboyDirectory, 'spineboy.atlas'), 'utf8'),
      readFile(resolve(spineboyDirectory, 'spineboy-pro.json'), 'utf8'),
    ]);
    const texture = {
      source: Texture.EMPTY.source,
      update: vi.fn<() => void>(),
    };
    const loadTexture = vi.spyOn(Assets, 'load').mockResolvedValue(texture);
    const skeletonData = await loadPixiSpine({
      assetMode: 'inline',
      category: 'spines',
      id: 'spineboy',
      source: {
        atlas,
        format: 'json',
        images: ['spineboy.png'],
        scale: 1,
        skel: JSON.parse(skeletonSource),
      },
    });

    fixtures.spines.spineboy = skeletonData;

    const spineboy = createSpine({ skeleton: 'spineboy' });
    const idle = spineboy.state.setAnimation(0, 'idle', true);

    expect(loadTexture).toHaveBeenCalledWith('spineboy.png');
    expect(skeletonData.animations.some(({ name }) => name === 'idle')).toBe(true);
    expect(skeletonData.skins.some(({ name }) => name === 'default')).toBe(true);
    expect(idle.animation?.name).toBe('idle');

    spineboy.destroy();
  });

  it('loads a real binary Spine 4.3 export without format detection', async () => {
    const [atlas, skeleton] = await Promise.all([
      readFile(resolve(raptorDirectory, 'raptor.atlas'), 'utf8'),
      readFile(resolve(raptorDirectory, 'raptor-pro.skel')),
    ]);
    const texture = {
      source: Texture.EMPTY.source,
      update: vi.fn<() => void>(),
    };
    vi.spyOn(Assets, 'load').mockResolvedValue(texture);
    const fetchResource = vi.fn<typeof fetch>(() => {
      throw new Error('CSP blocked fetch');
    });
    vi.stubGlobal('fetch', fetchResource);

    const skeletonData = await loadPixiSpine({
      assetMode: 'inline',
      category: 'spines',
      id: 'raptor',
      source: {
        atlas,
        format: 'skel',
        images: ['raptor.png'],
        scale: 0.5,
        skel: `data:application/octet-stream;base64,${skeleton.toString('base64')}`,
      },
    });

    fixtures.spines.raptor = skeletonData;

    const raptor = createSpine({ skeleton: 'raptor' });
    const walk = raptor.state.setAnimation(0, 'walk', true);

    expect(skeletonData.animations.some(({ name }) => name === 'walk')).toBe(true);
    expect(walk.animation?.name).toBe('walk');
    expect(texture.source.resolution).toBe(0.5);
    expect(fetchResource).not.toHaveBeenCalled();

    raptor.destroy();
  });
});
