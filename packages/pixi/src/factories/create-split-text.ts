import { SplitText } from 'pixi.js';

import type { CreateSplitTextOptions } from '#types/factories.js';

import { applyContainerOptions } from './apply-container-options.js';

/**
 * Creates unattached split text with Pixi's native splitting options.
 * Unlike Text, SplitText is a container, so it has no shared anchor default.
 * With autoSplit: false, call split() explicitly before accessing the characters.
 * Fitting, localization, and character animation remain application concerns.
 */
export function createSplitText(options: CreateSplitTextOptions): SplitText {
  const textObject = new SplitText(options);

  applyContainerOptions(textObject, options);

  return textObject;
}
