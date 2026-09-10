/**
 * Validated Replayable project configuration and deterministic playable variant expansion.
 *
 * @example Define a project and create every configured playable variant.
 *
 * ```ts
 * import { createVariants, defineConfig } from '@replayablejs/config';
 *
 * const config = defineConfig({
 *   assets: {
 *     sourceDir: 'assets',
 *     outDir: 'src/assets/resources',
 *     assets: {},
 *     emit: { assets: 'src/assets/assets.ts' },
 *   },
 *   localization: { fallback: 'en', languages: ['en', 'hy'] },
 *   devtools: { stats: { fps: false } },
 *   name: 'basic-playable',
 *   networks: { preview: {}, meta: {} },
 *   screen: {
 *     orientations: {
 *       portrait: {
 *         enabled: true,
 *         width: 700,
 *         height: 1400,
 *         ratio: { min: 0.46, max: 0.76 },
 *       },
 *       landscape: {
 *         enabled: true,
 *         width: 1400,
 *         height: 700,
 *         ratio: { min: 1.32, max: 2.18 },
 *       },
 *     },
 *     resolution: {
 *       pixelRatio: { min: 1, max: 2 },
 *       renderScale: { minimal: 0.55, reduced: 0.65, balanced: 0.85, full: 1 },
 *     },
 *   },
 *   store: {
 *     androidUrl: 'https://play.google.com/store/apps/details?id=com.example.game',
 *     iosUrl: 'https://apps.apple.com/app/id123456789',
 *   },
 *   versions: { default: {}, winter: {} },
 * });
 *
 * const variants = createVariants(config);
 * console.log(variants.map(({ id }) => id));
 * ```
 *
 * @packageDocumentation
 */

export { defineConfig } from '#config/define-config.js';
export { replayableAssetsSchema, replayableConfigSchema } from '#config/schema.js';
export { createVariants } from '#variants/create-variants.js';
export type {
  ReplayableAssetsConfig,
  ReplayableAssetsConfigInput,
  ReplayableBuild,
  ReplayableBuildInput,
  ReplayableControls,
  ReplayableControlsInput,
  ReplayableDevtools,
  ReplayableDevtoolsInput,
  ReplayableCompletion,
  ReplayableCompletionInput,
  ReplayableConfig,
  ReplayableConfigInput,
  ReplayableLocalization,
  ReplayableLocalizationInput,
  ReplayableNetwork,
  ReplayableParamDefinition,
  ReplayableParamsInput,
  ReplayableParamValue,
  ReplayableScreen,
  ReplayableScreenInput,
  ReplayableStore,
  ReplayableStoreInput,
} from '#types/config.js';
export type { PlayableVariant } from '#types/variant.js';
