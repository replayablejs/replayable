import type { z } from 'zod';

import type { replayableAssetsSchema, replayableConfigSchema } from '#config/schema.js';
import type { networkSchema } from '#config/schemas/variants.js';

/** Validated Replayable project configuration with every schema default applied. */
export type ReplayableConfig = z.infer<typeof replayableConfigSchema>;

/** Human-authored Replayable project configuration accepted before defaults are applied. */
export type ReplayableConfigInput = z.input<typeof replayableConfigSchema>;

/** Validated language-independent asset configuration stored in the project config. */
export type ReplayableAssetsConfig = z.infer<typeof replayableAssetsSchema>;

/** Language-independent asset configuration accepted from project authors. */
export type ReplayableAssetsConfigInput = z.input<typeof replayableAssetsSchema>;

/** Validated project-wide build configuration. */
export type ReplayableBuild = ReplayableConfig['build'];

/** Project-wide build configuration accepted before defaults are applied. */
export type ReplayableBuildInput = ReplayableConfigInput['build'];

/** Validated automatic playable completion conditions. */
export type ReplayableCompletion = ReplayableConfig['completion'];

/** Automatic completion conditions accepted before defaults are applied. */
export type ReplayableCompletionInput = ReplayableConfigInput['completion'];

/** Preview control preferences; ad-network profiles own the final visibility. */
export type ReplayableControls = ReplayableConfig['controls'];

/** Optional preview controls accepted before defaults are applied. */
export type ReplayableControlsInput = ReplayableConfigInput['controls'];

/** Validated project-wide development tool settings. */
export type ReplayableDevtools = ReplayableConfig['devtools'];

/** Development tool shorthand accepted before defaults are applied. */
export type ReplayableDevtoolsInput = ReplayableConfigInput['devtools'];

/** Validated build languages and missing-translation fallback. */
export type ReplayableLocalization = ReplayableConfig['localization'];

/** Localization configuration accepted in a human-authored Replayable config. */
export type ReplayableLocalizationInput = ReplayableConfigInput['localization'];

/** Delivery network with an implementation owned by Replayable. */
export type ReplayableNetwork = z.infer<typeof networkSchema>;

/** One validated boolean, number, or string parameter definition. */
export type ReplayableParamDefinition = ReplayableConfig['params'][string];

/** Primitive value accepted by a concrete parameter. */
export type ReplayableParamValue = ReplayableParamDefinition['default'];

/** Parameter definitions accepted in a human-authored Replayable config. */
export type ReplayableParamsInput = ReplayableConfigInput['params'];

/** Validated rendering dimensions and resolution policy. */
export type ReplayableScreen = ReplayableConfig['screen'];

/** Screen configuration accepted in a human-authored Replayable config. */
export type ReplayableScreenInput = ReplayableConfigInput['screen'];

/** Validated iOS and Android destinations for the playable's call to action. */
export type ReplayableStore = ReplayableConfig['store'];

/** Store destinations accepted in a human-authored Replayable config. */
export type ReplayableStoreInput = ReplayableConfigInput['store'];
