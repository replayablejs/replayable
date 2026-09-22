import type { sprites } from '../assets/registries/sprites';

/** A sprite identifier emitted by the asset pipeline. */
export type UiSpriteAsset = (typeof sprites)[keyof typeof sprites];
