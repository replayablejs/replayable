import type { AssetsModuleContext, RegistryObject } from '#types/emission.js';
import type { ProcessedSpineAsset } from '#types/processed-assets.js';

import { registerImport } from '../utils/assets-module.js';
import { renderPropertyKey } from '../utils/object-literal.js';
import { createIdentityRegistry } from '../utils/registry.js';

/**
 * Serializes one processed Spine asset as one TypeScript property line inside
 * the generated `assets` object.
 *
 * Resolution and processing have already assembled every physical file into
 * one complete logical Spine asset. A two-page JSON Spine named `hero` arrives
 * as one processed record:
 *
 * ```ts
 * {
 *   bundle: 'primary',
 *   category: 'spines',
 *   id: 'hero',
 *   files: {
 *     skeleton: {
 *       format: 'json',
 *       path: '/project/assets/generated/spines/hero/skeleton.json',
 *     },
 *     atlas: {
 *       format: 'atlas',
 *       path: '/project/assets/generated/spines/hero/atlas.atlas',
 *     },
 *     images: [
 *       {
 *         format: 'webp',
 *         path: '/project/assets/generated/spines/hero/images/page0.webp',
 *       },
 *       {
 *         format: 'avif',
 *         path: '/project/assets/generated/spines/hero/images/page1.avif',
 *       },
 *     ],
 *   },
 *   metadata: {
 *     animationNames: ['idle', 'run'],
 *     skinNames: ['default', 'armored'],
 *   },
 *   runtime: { scale: 0.5 },
 * }
 * ```
 *
 * With an initially empty module context, rendering registers the skeleton,
 * atlas description, and texture pages in semantic order:
 *
 * ```ts
 * import spine_0 from '../../assets/generated/spines/hero/skeleton.json';
 * import spine_1 from '../../assets/generated/spines/hero/atlas.atlas';
 * import image_2 from '../../assets/generated/spines/hero/images/page0.webp';
 * import image_3 from '../../assets/generated/spines/hero/images/page1.avif';
 * ```
 *
 * The function then returns exactly one property line for the complete logical
 * asset:
 *
 * ```ts
 * '      "hero": { format: "json", skel: spine_0, atlas: spine_1, images: [image_2, image_3], scale: 0.5 },'
 * ```
 *
 * Each texture page has independently retained its smallest image encoding, so
 * page 0 can be WebP while page 1 is AVIF. Processing stores the selected files
 * in the order declared by the Spine atlas. Array mapping preserves that order
 * during import registration and in the generated runtime `images` array.
 *
 * The runtime field `skel` references either a JSON skeleton, as above, or a
 * binary `.skel` file. Every physical file retains its generated extension and
 * uses an ordinary static import without attributes or query suffixes. The
 * playable's bundler decides how each extension is loaded.
 *
 * `scale` comes from the shared image options used to resize texture pages. It
 * remains in the runtime entry so a rendering integration can restore each
 * texture page's authored logical dimensions. Quality and lossless controls
 * are build-only and are not emitted.
 *
 * Source completeness belongs to resolution. Processing keeps the required
 * files together, so this renderer only registers imports and serializes one
 * complete runtime entry.
 *
 * @param asset - One complete processed Spine asset with ordered texture pages.
 * @param context - Module-wide state used to register every generated Spine file.
 * @returns One indented TypeScript source line for the Spine asset.
 */
export function renderSpineEntry(asset: ProcessedSpineAsset, context: AssetsModuleContext): string {
  const skeletonFileImport = registerImport(context, 'spine', asset.files.skeleton.path);
  const atlasFileImport = registerImport(context, 'spine', asset.files.atlas.path);
  const texturePageImports = asset.files.images.map((image) =>
    registerImport(context, 'image', image.path),
  );

  return `      ${renderPropertyKey(asset.id)}: { format: ${JSON.stringify(asset.files.skeleton.format)}, skel: ${skeletonFileImport}, atlas: ${atlasFileImport}, images: [${texturePageImports.join(', ')}], scale: ${asset.runtime.scale} },`;
}

/**
 * Builds skeleton, animation, and skin registry values for all Spine assets.
 *
 * Unlike `renderSpineEntry`, this function does not register file imports or
 * produce TypeScript source. It converts animation and skin names retained
 * during processing into a plain nested object. `emitRegistries` later
 * serializes that value into the generated `spines.ts` module.
 *
 * For example, this processed Spine asset can reach the function inside a
 * one-item array:
 *
 * ```ts
 * [
 *   {
 *     bundle: 'primary',
 *     category: 'spines',
 *     id: 'hero',
 *     files: {
 *       skeleton: {
 *         format: 'json',
 *         path: '/project/assets/generated/spines/hero/skeleton.json',
 *       },
 *       atlas: {
 *         format: 'atlas',
 *         path: '/project/assets/generated/spines/hero/atlas.atlas',
 *       },
 *       images: [
 *         {
 *           format: 'webp',
 *           path: '/project/assets/generated/spines/hero/images/page0.webp',
 *         },
 *         {
 *           format: 'avif',
 *           path: '/project/assets/generated/spines/hero/images/page1.avif',
 *         },
 *       ],
 *     },
 *     metadata: {
 *       animationNames: ['idle', 'run'],
 *       skinNames: ['default', 'armored'],
 *     },
 *     runtime: {
 *       scale: 0.5,
 *     },
 *   },
 * ]
 * ```
 *
 * If the generated skeleton declares the animations `idle` and `run` and the
 * skins `default` and `armored`, the function returns:
 *
 * ```ts
 * {
 *   hero: {
 *     skeleton: 'hero',
 *     animations: {
 *       idle: 'idle',
 *       run: 'run',
 *     },
 *     skins: {
 *       armored: 'armored',
 *       default: 'default',
 *     },
 *   },
 * }
 * ```
 *
 * The outer `hero` key groups metadata for one logical Spine asset.
 * `skeleton` repeats that stable asset ID as a directly consumable registry
 * value, while `animations` and `skins` provide typed identity lookups for the
 * names authored inside the skeleton.
 *
 * Metadata extraction already supported either JSON or binary SKEL through the
 * official Spine runtime during processing. Texture page files, selected image
 * encodings, and runtime scale are not registry metadata; they remain available
 * through the generated `assets` entry.
 *
 * Assets arrive in deterministic ID order from the shared emitter grouping
 * step. Each animation and skin collection is converted through
 * `createIdentityRegistry`, which keeps its keys unique and alphabetically
 * ordered. Bundle membership does not appear in the registry.
 *
 * @param assets - Complete processed Spine assets across all bundles.
 * @returns The deterministic Spine metadata registry.
 */
export function renderSpineRegistry(assets: readonly ProcessedSpineAsset[]): RegistryObject {
  const entries = assets.map(
    (asset) =>
      [
        asset.id,
        {
          skeleton: asset.id,
          animations: createIdentityRegistry(asset.metadata.animationNames),
          skins: createIdentityRegistry(asset.metadata.skinNames),
        },
      ] as const,
  );

  return Object.fromEntries(entries);
}
