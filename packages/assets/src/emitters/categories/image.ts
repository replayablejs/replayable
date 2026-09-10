import type { AssetsModuleContext, RegistryObject } from '#types/emission.js';
import type { ProcessedImageAsset } from '#types/processed-assets.js';

import { registerImport } from '../utils/assets-module.js';
import { renderPropertyKey } from '../utils/object-literal.js';
import { createIdentityRegistry } from '../utils/registry.js';

/**
 * Serializes one processed sprite or texture as one TypeScript property line
 * inside the generated `assets` object.
 *
 * Processing has already generated every applicable AVIF, WebP, PNG, or JPEG
 * candidate, compared their file sizes, retained the smallest, and deleted the
 * rejected candidates. This renderer receives exactly one selected image:
 *
 * ```ts
 * {
 *   bundle: 'primary',
 *   category: 'sprites',
 *   id: 'logo',
 *   file: {
 *     format: 'webp',
 *     path: '/project/assets/generated/sprites/logo.webp',
 *   },
 *   runtime: {
 *     scale: 0.5,
 *   },
 * }
 * ```
 *
 * With an initially empty module context, rendering this record registers:
 *
 * ```ts
 * import image_0 from '../../assets/generated/sprites/logo.webp';
 * ```
 *
 * and returns exactly one property line:
 *
 * ```ts
 * '      "logo": { src: image_0, scale: 0.5 },'
 * ```
 *
 * The selected encoding does not affect the runtime shape: `src` is always one
 * imported value rather than a format map. Sprites and textures use the same
 * entry shape, so their surrounding category block is the only distinction in
 * generated source; `asset.category` is not repeated inside the entry.
 *
 * Localized sprite selection belongs to resolution. A selected source such as
 * `logo.hy.png` therefore reaches this renderer with the stable runtime ID
 * `logo` and no language suffix. `scale` records the resize factor that
 * processing already applied to the generated image.
 *
 * @param asset - One complete processed sprite or texture with its selected image.
 * @param context - Module-wide state used to register the generated image file.
 * @returns One indented TypeScript source line for the image.
 */
export function renderImageEntry(asset: ProcessedImageAsset, context: AssetsModuleContext): string {
  const imageFileImport = registerImport(context, 'image', asset.file.path);

  return `      ${renderPropertyKey(asset.id)}: { src: ${imageFileImport}, scale: ${asset.runtime.scale} },`;
}

/**
 * Builds the runtime-ID registry for one image category across the build.
 *
 * This shared renderer is used for both `sprites` and `textures`, but one call
 * receives only one category. `emitRegistries` passes the complete category
 * bucket across all bundles.
 *
 * For example, one call for the `sprites` category can receive:
 *
 * ```ts
 * [
 *   {
 *     bundle: 'primary',
 *     category: 'sprites',
 *     id: 'logo',
 *     file: {
 *       format: 'webp',
 *       path: '/project/assets/generated/sprites/logo.webp',
 *     },
 *     runtime: {
 *       scale: 0.5,
 *     },
 *   },
 *   {
 *     bundle: 'primary',
 *     category: 'sprites',
 *     id: 'ui/play-button',
 *     file: {
 *       format: 'avif',
 *       path: '/project/assets/generated/sprites/ui/play-button.avif',
 *     },
 *     runtime: {
 *       scale: 1,
 *     },
 *   },
 * ]
 * ```
 *
 * and returns this plain registry value:
 *
 * ```ts
 * {
 *   logo: 'logo',
 *   'ui/play-button': 'ui/play-button',
 * }
 * ```
 *
 * Registry keys and values are the same stable runtime IDs used in the
 * generated `assets` object. File paths, selected encodings, and image scales
 * are deliberately excluded because the registry identifies assets; the
 * generated assets module contains their loadable runtime data.
 *
 * Localized sprite resolution has already removed language suffixes. If the
 * Armenian build selected `logo.hy.png`, its processed ID and registry entry
 * are still `logo`. Textures follow the same identity shape, although they are
 * emitted into a separate `textures` registry.
 *
 * `createIdentityRegistry` sorts IDs alphabetically, keeping generated output
 * deterministic. Asset identity has already been validated before emission,
 * so repeated IDs produce the same identity value. Bundle membership does not
 * appear in the registry.
 *
 * @param assets - Processed sprites or textures from one complete category.
 * @returns A deterministic runtime-ID identity lookup ready for serialization.
 */
export function renderImageRegistry(assets: readonly ProcessedImageAsset[]): RegistryObject {
  return createIdentityRegistry(assets.map((asset) => asset.id));
}
