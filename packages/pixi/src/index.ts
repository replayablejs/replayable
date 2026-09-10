/**
 * PixiJS rendering integration for Replayable playables.
 *
 * @packageDocumentation
 */

export type { CreateButtonOptions, ReplayableButton } from '#types/button.js';
export type { FitTextOptions } from '#types/text.js';
export type {
  AnchorableDisplayObjectOptions,
  CreateAnimatedSpriteOptions,
  CreateNineSliceSpriteOptions,
  CreateSpriteOptions,
  CreateSplitTextOptions,
  CreateTextOptions,
  DisplayObjectOptions,
  SpriteDisplayOptions,
} from '#types/factories.js';
export type {
  LayoutAlignment,
  LayoutAreaConfig,
  LayoutBounds,
  LayoutConfig,
  LayoutDebugLabelOptions,
  LayoutDebugOptions,
  LayoutScaleMode,
  ReplayableLayout,
  ResolvedLayoutArea,
} from '#types/layout.js';
export type { CreatePixiOptions, PixiIntegration, ReplayablePixi } from '#types/pixi.js';
export { createPixi } from './create-pixi.js';
export { createButton } from './factories/create-button.js';
export { createAnimatedSprite } from './factories/create-animated-sprite.js';
export { createNineSliceSprite } from './factories/create-nine-slice-sprite.js';
export { createSprite } from './factories/create-sprite.js';
export { createSplitText } from './factories/create-split-text.js';
export { createText } from './factories/create-text.js';
export { createLayout } from './layout/create-layout.js';
export { fitText } from './text/fit-text.js';
