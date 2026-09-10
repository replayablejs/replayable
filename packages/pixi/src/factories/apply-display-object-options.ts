import type { AnchorableDisplayObject, AnchorableDisplayObjectOptions } from '#types/factories.js';

import { applyContainerOptions } from './apply-container-options.js';

const CENTER_ANCHOR = { x: 0.5, y: 0.5 };

/** Applies the defaults shared by every Replayable Pixi factory. */
export function applyDisplayObjectOptions(
  displayObject: AnchorableDisplayObject,
  options: AnchorableDisplayObjectOptions,
): void {
  applyContainerOptions(displayObject, options);
  displayObject.anchor.copyFrom(options.anchor ?? CENTER_ANCHOR);
}
