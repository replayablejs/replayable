import type { UiSpriteAsset } from './ui-image';

export interface CtaButtonConfig {
  /** Already-localized text displayed over the artwork. */
  readonly text: string;
  /** Loaded sprite used as the button background. */
  readonly artwork: UiSpriteAsset;
}
