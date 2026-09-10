import type { AssetsModuleContext, RegistryObject } from '#types/emission.js';
import type { ProcessedFontAsset } from '#types/processed-assets.js';

import { registerImport } from '../utils/assets-module.js';
import { renderPropertyKey } from '../utils/object-literal.js';
import { createIdentityRegistry } from '../utils/registry.js';

/**
 * Serializes one processed font as one TypeScript property line inside the
 * generated `assets` object.
 *
 * Processing has already subset the source font and emitted its one runtime
 * WOFF2 file. This renderer receives that generated file together with the
 * required CSS family configured for the asset:
 *
 * ```ts
 * {
 *   bundle: 'primary',
 *   category: 'fonts',
 *   id: 'heading',
 *   file: {
 *     format: 'woff2',
 *     path: '/project/assets/generated/fonts/heading.woff2',
 *   },
 *   runtime: {
 *     family: 'Brand Display',
 *   },
 * }
 * ```
 *
 * With an initially empty module context, rendering this record registers:
 *
 * ```ts
 * import font_0 from '../../assets/generated/fonts/heading.woff2';
 * ```
 *
 * and returns exactly one property line:
 *
 * ```ts
 * '      "heading": { src: font_0, family: "Brand Display" },'
 * ```
 *
 * The runtime ID `heading` is the key used to retrieve this asset from the
 * generated object. `Brand Display` is the required family name used by CSS;
 * the two values serve different purposes and do not need to match.
 *
 * Charset construction, `extraCharacters`, and font subsetting are build-only
 * concerns completed before emission. They are intentionally absent from the
 * runtime entry. Application CSS owns descriptors such as style, weight,
 * stretch, and display; this renderer does not infer them from filenames or
 * font metadata.
 *
 * @param asset - One complete processed font containing its WOFF2 file and family.
 * @param context - Module-wide state used to register the generated font file.
 * @returns One indented TypeScript source line for the font.
 */
export function renderFontEntry(asset: ProcessedFontAsset, context: AssetsModuleContext): string {
  const fontFileImport = registerImport(context, 'font', asset.file.path);

  return `      ${renderPropertyKey(asset.id)}: { src: ${fontFileImport}, family: ${JSON.stringify(asset.runtime.family)} },`;
}

/**
 * Builds the font-family registry value for all processed fonts in the build.
 *
 * This function does not render TypeScript source or register WOFF2 imports.
 * It extracts the CSS family from each processed font and creates a plain
 * identity lookup. `emitRegistries` later serializes that value into the
 * generated `fonts.ts` module.
 *
 * For example, this input contains two font assets from the build:
 *
 * ```ts
 * [
 *   {
 *     bundle: 'primary',
 *     category: 'fonts',
 *     id: 'body',
 *     file: {
 *       format: 'woff2',
 *       path: '/project/assets/generated/fonts/body.woff2',
 *     },
 *     runtime: {
 *       family: 'Replayable Body',
 *     },
 *   },
 *   {
 *     bundle: 'primary',
 *     category: 'fonts',
 *     id: 'heading',
 *     file: {
 *       format: 'woff2',
 *       path: '/project/assets/generated/fonts/heading.woff2',
 *     },
 *     runtime: {
 *       family: 'Brand Display',
 *     },
 *   },
 * ]
 * ```
 *
 * The function returns:
 *
 * ```ts
 * {
 *   'Brand Display': 'Brand Display',
 *   'Replayable Body': 'Replayable Body',
 * }
 * ```
 *
 * Registry keys intentionally use configured CSS families rather than asset
 * IDs. Application code uses these values in CSS declarations such as
 * `font-family: fonts['Brand Display']`; the build-only IDs `body` and
 * `heading` address entries in the generated `assets` object instead.
 *
 * `createIdentityRegistry` deduplicates repeated families and sorts them
 * alphabetically, so two font assets configured with the same family produce
 * one registry entry and generated output remains deterministic. Font paths,
 * formats, charset information, and CSS descriptors do not belong in this
 * lookup.
 *
 * `emitRegistries` calls this function once with fonts from the complete build;
 * bundle membership is intentionally absent from the returned registry.
 *
 * @param assets - Complete processed fonts across all bundles.
 * @returns A deterministic CSS-family identity lookup ready for serialization.
 */
export function renderFontRegistry(assets: readonly ProcessedFontAsset[]): RegistryObject {
  return createIdentityRegistry(assets.map((asset) => asset.runtime.family));
}
