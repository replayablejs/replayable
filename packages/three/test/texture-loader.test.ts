import { NoColorSpace, Texture, TextureLoader } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadThreeTexture } from '../src/loader/load-three-texture.js';

afterEach(() => vi.restoreAllMocks());

describe('standalone texture loading', () => {
  it.each(['texture.webp', 'data:image/png;base64,example'])(
    'loads %s without guessing its material role or changing UV scale',
    async (src) => {
      const texture = new Texture<HTMLImageElement>();
      const load = vi.spyOn(TextureLoader.prototype, 'loadAsync').mockResolvedValue(texture);
      const result = await loadThreeTexture({
        category: 'textures',
        id: 'surface',
        assetMode: 'resource',
        source: { src, scale: 0.5 },
      });
      expect(load).toHaveBeenCalledWith(src);
      expect(result).toBe(texture);
      expect(result.colorSpace).toBe(NoColorSpace);
      expect(result.repeat.toArray()).toEqual([1, 1]);
      texture.dispose();
    },
  );

  it('identifies the texture and preserves the load failure', async () => {
    const cause = new Error('image failed');
    vi.spyOn(TextureLoader.prototype, 'loadAsync').mockRejectedValue(cause);
    await expect(
      loadThreeTexture({
        category: 'textures',
        id: 'surface',
        assetMode: 'resource',
        source: { src: 'missing.webp', scale: 1 },
      }),
    ).rejects.toMatchObject({ message: 'Cannot load texture "surface": image failed', cause });
  });
});
