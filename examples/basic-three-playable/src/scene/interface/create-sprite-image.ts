import { playable } from '@replayablejs/runtime';

import type { UiSpriteAsset } from '../../types/ui-image';

/** Create a separate DOM image using a sprite already loaded by Replayable. */
export function createSpriteImage(asset: UiSpriteAsset, alt: string): HTMLImageElement {
  // loadImage stores HTMLImageElements. The UI is created after playable.ready().
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const cachedImage = playable.loader.cache.sprites![asset] as HTMLImageElement;

  // Reuse the source, not the cached element: each UI owner needs its own DOM node.
  const image = new Image();
  image.src = cachedImage.src;
  image.alt = alt;
  image.draggable = false;

  return image;
}
