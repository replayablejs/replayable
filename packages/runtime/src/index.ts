/**
 * Browser runtime for lifecycle-aware playable ads.
 *
 * @packageDocumentation
 */

export { playable } from './playable.js';
export type {
  AudioOneShotOptions,
  AudioPlayback,
  AudioPlaybackOptions,
  AudioStopOptions,
  PlayableAudio,
  RuntimeAudioState,
} from '#types/audio.js';
export type { Localization } from '#types/localization.js';
export type {
  EndCardAnimation,
  EndCardInteraction,
  RuntimeEndCardConfig,
} from '#types/end-card.js';
export type {
  AssetBundleLoadedListener,
  AssetCache,
  AssetLoadedContext,
  AssetLoadedListener,
  AssetLoadContext,
  AssetLoader,
  AssetLoadHandler,
  BuiltInAssetCategory,
  BuiltInAssetValueByCategory,
  LoadedShaderAsset,
  RegisteredAssetCategory,
} from '#types/loader.js';
export type {
  PlayableCompletion,
  PlayableCompletionReason,
  RuntimeCompletionConfig,
} from '#types/completion.js';
export type { RuntimeControlsConfig } from '#types/controls.js';
export type { RuntimeDevtoolsConfig, RuntimeStatsConfig } from '#types/devtools.js';
export type {
  Playable,
  RuntimeConfig,
  RuntimeDefinition,
  RuntimeEventListener,
  RuntimeEventMap,
  RuntimeLocalizationConfig,
  RuntimeNetwork,
  RuntimeParamValue,
  RuntimeState,
  RuntimeStoreConfig,
} from '#types/runtime.js';
export type {
  RuntimeOrientation,
  RuntimeOrientationConfig,
  RuntimeRange,
  RuntimeRenderScaleConfig,
  RuntimeResolutionConfig,
  RuntimeScreenConfig,
  RuntimeViewport,
  Screen,
  ScreenDesign,
  ScreenFrame,
} from '#types/screen.js';
export type { InactivityTimer, InactivityTimerOptions, PlayableTimers } from '#types/timers.js';
export type {
  FixedUpdateContext,
  PostRenderContext,
  UpdateChannel,
  UpdateContext,
} from '#types/update.js';
