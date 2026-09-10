import { playable } from '@replayablejs/runtime';
import { Filter, GlProgram, Texture, UniformGroup } from 'pixi.js';

import { shaders, sprites } from '../../assets/registries';
import type { DissolveFilter } from '../../types/background';

/** Creates the dissolve's GPU resources from assets already loaded in the primary bundle. */
export function createDissolveFilter(): DissolveFilter {
  const shader = playable.loader.cache.shaders?.[shaders.dissolve];
  if (shader === undefined) {
    throw new Error('The dissolve shader must be loaded before creating its filter.');
  }

  // This standalone noise texture can repeat without sampling neighboring atlas sprites.
  // The filter borrows it; destroying the filter must not destroy the shared texture.
  const noise = Texture.from(sprites['vfx/dissolve-noise']).source;
  noise.style.addressMode = 'repeat';
  noise.style.scaleMode = 'linear';

  const progress = new UniformGroup({ uProgress: { value: 0, type: 'f32' } });
  const filter = new Filter({
    glProgram: GlProgram.from({
      vertex: shader.vert,
      fragment: shader.frag,
      name: 'background-dissolve',
    }),
    resources: {
      dissolveUniforms: progress,
      uNoiseTexture: noise,
      uNoiseSampler: noise.style,
    },
    resolution: 1,
    padding: 0,
  });

  // Motion animates this same object; Pixi reads its value when rendering the filter.
  return { filter, uniforms: progress.uniforms };
}
