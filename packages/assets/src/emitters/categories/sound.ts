import type { AssetsModuleContext, RegistryObject } from '#types/emission.js';
import type { ProcessedSoundAsset } from '#types/processed-assets.js';

import { registerImport } from '../utils/assets-module.js';
import { renderPropertyKey } from '../utils/object-literal.js';
import { createIdentityRegistry } from '../utils/registry.js';

/**
 * Serializes one processed sound as one TypeScript property line inside the
 * generated `assets` object.
 *
 * Processing has already transcoded the source as MP3 and M4A, measured both
 * generated files, retained the smaller candidate, and deleted the rejected
 * candidate. This renderer therefore receives only the selected runtime file:
 *
 * ```ts
 * {
 *   bundle: 'primary',
 *   category: 'sounds',
 *   id: 'click',
 *   file: {
 *     format: 'm4a',
 *     path: '/project/assets/generated/sounds/click.m4a',
 *   },
 * }
 * ```
 *
 * With an initially empty module context, rendering this record registers:
 *
 * ```ts
 * import sound_0 from '../../assets/generated/sounds/click.m4a';
 * ```
 *
 * and returns exactly one direct runtime reference:
 *
 * ```ts
 * '      "click": sound_0,'
 * ```
 *
 * The winning encoding does not change the runtime shape. There is no format
 * map, fallback field, or source array because a playable ships only the one
 * selected file. Bitrate, channels, and sample rate are build-only transcoding
 * controls and are intentionally absent from the runtime entry. The playable's
 * bundler decides how the ordinary static audio import becomes a runtime URL or
 * equivalent value.
 *
 * @param asset - One complete processed sound containing its selected audio file.
 * @param context - Module-wide state used to register the generated sound file.
 * @returns One indented TypeScript source line for the sound.
 */
export function renderSoundEntry(asset: ProcessedSoundAsset, context: AssetsModuleContext): string {
  const soundFileImport = registerImport(context, 'sound', asset.file.path);

  return `      ${renderPropertyKey(asset.id)}: ${soundFileImport},`;
}

/**
 * Builds the runtime-ID registry for all processed sounds in the build.
 *
 * This function does not render TypeScript source or register audio imports. It
 * extracts each sound's stable runtime ID and returns a plain identity lookup.
 * `emitRegistries` later serializes that value into the generated `sounds.ts`
 * module.
 *
 * For example, this input contains two sounds whose automatic encoding
 * selection produced different winning formats:
 *
 * ```ts
 * [
 *   {
 *     bundle: 'primary',
 *     category: 'sounds',
 *     id: 'click',
 *     file: {
 *       format: 'm4a',
 *       path: '/project/assets/generated/sounds/click.m4a',
 *     },
 *   },
 *   {
 *     bundle: 'primary',
 *     category: 'sounds',
 *     id: 'music/theme',
 *     file: {
 *       format: 'mp3',
 *       path: '/project/assets/generated/sounds/music/theme.mp3',
 *     },
 *   },
 * ]
 * ```
 *
 * The function returns:
 *
 * ```ts
 * {
 *   click: 'click',
 *   'music/theme': 'music/theme',
 * }
 * ```
 *
 * Registry identity is independent of the selected MP3 or M4A encoding. Code
 * selects the sound through a stable value such as
 * `sounds['music/theme']`; the generated `assets` module owns the
 * corresponding imported file. Paths, formats, and transcoding options are
 * therefore intentionally absent from this registry.
 *
 * `createIdentityRegistry` sorts sound IDs alphabetically for deterministic
 * generated output. Sound identity has already been validated before emission,
 * and no generated audio files need to be read here. Bundle membership does
 * not appear in the registry.
 *
 * @param assets - Complete processed sounds across all bundles.
 * @returns A deterministic sound-ID identity lookup ready for serialization.
 */
export function renderSoundRegistry(assets: readonly ProcessedSoundAsset[]): RegistryObject {
  return createIdentityRegistry(assets.map((asset) => asset.id));
}
