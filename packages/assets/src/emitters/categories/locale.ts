import type { AssetsModuleContext, RegistryObject } from '#types/emission.js';
import type { ProcessedLocaleAsset } from '#types/processed-assets.js';

import { registerImport } from '../utils/assets-module.js';
import { renderPropertyKey } from '../utils/object-literal.js';
import { createIdentityRegistry } from '../utils/registry.js';

/**
 * Serializes one processed locale dictionary as one TypeScript property line
 * inside the generated `assets` object.
 *
 * One input item represents one compiled JSON dictionary. Locale resolution is
 * already complete: each phrase contains either the configured build language
 * or its fallback, never every authored language. For example, a source file
 * named `translations.jsonc` can arrive as:
 *
 *   {
 *     id: 'translations',
 *     file: { format: 'json', path: '/out/locales/translations.json' },
 *   }
 *
 * Its generated file contains the final value selected for every phrase:
 *
 *   {
 *     "play": "Խաղալ",
 *     "install": "Install"
 *   }
 *
 * The renderer does not inspect or transform that JSON. It registers one
 * ordinary static import and returns its property line:
 *
 *   import locale_0 from '../../assets/out/locales/translations.json';
 *
 *   '      "translations": locale_0,'
 *
 * Replayable's bundler decides whether that import becomes a parsed inline
 * dictionary or an emitted resource URL. No query suffix, URL constructor, or
 * bundler-specific loading instruction appears in the generated module.
 *
 * Language selection and JSON compilation belong to processing. Runtime-key
 * uniqueness and collection ordering are handled centrally. This renderer owns
 * one JSON import and one source line.
 *
 * @returns One indented TypeScript source line for the locale dictionary.
 */
export function renderLocaleEntry(
  asset: ProcessedLocaleAsset,
  context: AssetsModuleContext,
): string {
  const dictionaryImport = registerImport(context, 'locale', asset.file.path);

  return `      ${renderPropertyKey(asset.id)}: ${dictionaryImport},`;
}

/**
 * Builds the phrase-ID registry from the generated translation dictionary.
 *
 * This function does not render TypeScript source or register JSON imports. It
 * collects the top-level phrase IDs retained on each processed locale and
 * returns a plain identity lookup. `emitRegistries` later serializes that
 * lookup into the generated `locales.ts` module.
 *
 * For example, this input represents the processed dictionary:
 *
 * ```ts
 * [
 *   {
 *     bundle: 'primary',
 *     category: 'locales',
 *     id: 'translations',
 *     file: {
 *       format: 'json',
 *       path: '/project/assets/generated/locales/translations.json',
 *     },
 *     phraseIds: ['play', 'install'],
 *   },
 * ]
 * ```
 *
 * The function combines those phrase IDs and returns:
 *
 * ```ts
 * {
 *   install: 'install',
 *   play: 'play',
 * }
 * ```
 *
 * Translation values are irrelevant to registry generation: both
 * `{ play: 'Խաղալ' }` and `{ play: 'Play' }` contribute the same phrase ID,
 * `play`. Language selection, fallback resolution, and extraction of these
 * top-level IDs were completed before emission.
 *
 * `createIdentityRegistry` sorts the final keys alphabetically for
 * deterministic output. Bundle membership does not appear in the registry.
 *
 * @param assets - The processed primary translation dictionary, when present.
 * @returns The deterministic phrase-ID identity lookup.
 */
export function renderLocaleRegistry(assets: readonly ProcessedLocaleAsset[]): RegistryObject {
  return createIdentityRegistry(assets.flatMap((asset) => asset.phraseIds));
}
