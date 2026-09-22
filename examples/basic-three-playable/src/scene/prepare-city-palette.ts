import { playable } from '@replayablejs/runtime';
import { SRGBColorSpace } from 'three';
import type { Texture } from 'three';

import { textures } from '../assets/registries/textures';

/**
 * Configures the already-loaded palette for use as a glTF base-color map.
 * Call after playable.ready(). This does not load or clone a texture: every
 * city model shares this cached instance, which the main scene disposes once.
 */
export function prepareCityPalette(): Texture {
  // createThree registers the Texture loader before readiness resolves.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const palette = playable.loader.cache.textures![textures['city-colormap']] as Texture;

  // Color artwork needs sRGB decoding; glTF UVs require an unflipped image.
  palette.colorSpace = SRGBColorSpace;
  palette.flipY = false;
  palette.needsUpdate = true;
  return palette;
}
