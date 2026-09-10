import { Text } from 'pixi.js';

import type { CreateTextOptions } from '#types/factories.js';

import { applyDisplayObjectOptions } from './apply-display-object-options.js';

/** Creates unattached Pixi canvas text while leaving content and layout to the application. */
export function createText(options: CreateTextOptions): Text {
  const textObject = new Text({ style: options.style, text: options.text });

  applyDisplayObjectOptions(textObject, options);

  return textObject;
}
