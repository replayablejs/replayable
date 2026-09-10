import type { AssetsModuleContext, RegistryObject } from '#types/emission.js';
import type { ProcessedAtlasAsset } from '#types/processed-assets.js';

import { registerImport } from '../utils/assets-module.js';
import { renderPropertyKey } from '../utils/object-literal.js';

/**
 * Serializes one processed atlas sheet as one TypeScript property line inside
 * the generated `assets` object.
 *
 * Processing has already paired each sheet's JSON frame data with its selected
 * texture image. This renderer therefore receives one complete logical sheet,
 * not independent files that still need to be grouped.
 *
 * For example, a texture packer that splits `ui/menu` into two sheets produces
 * two processed records and invokes this function once for each record:
 *
 * ```ts
 * [
 *   {
 *     bundle: 'primary',
 *     category: 'atlases',
 *     id: 'ui/menu-0',
 *     files: {
 *       json: {
 *         format: 'json',
 *         path: '/project/assets/generated/atlases/ui/menu-0.json',
 *       },
 *       image: {
 *         format: 'webp',
 *         path: '/project/assets/generated/atlases/ui/menu-0.webp',
 *       },
 *     },
 *   },
 *   {
 *     bundle: 'primary',
 *     category: 'atlases',
 *     id: 'ui/menu-1',
 *     files: {
 *       json: {
 *         format: 'json',
 *         path: '/project/assets/generated/atlases/ui/menu-1.json',
 *       },
 *       image: {
 *         format: 'avif',
 *         path: '/project/assets/generated/atlases/ui/menu-1.avif',
 *       },
 *     },
 *   },
 * ]
 * ```
 *
 * With an initially empty module context, the two calls register imports in
 * semantic sheet order:
 *
 * ```ts
 * import atlas_0 from '../../assets/generated/atlases/ui/menu-0.json';
 * import image_1 from '../../assets/generated/atlases/ui/menu-0.webp';
 * import atlas_2 from '../../assets/generated/atlases/ui/menu-1.json';
 * import image_3 from '../../assets/generated/atlases/ui/menu-1.avif';
 * ```
 *
 * The first call returns the first line and the second call returns the second:
 *
 * ```ts
 * '      "ui/menu-0": { json: atlas_0, image: image_1 },'
 * '      "ui/menu-1": { json: atlas_2, image: image_3 },'
 * ```
 *
 * A source atlas that fits on one sheet reaches this renderer once with the
 * unsuffixed base ID `ui/menu`. Packing, sheet naming, image selection, and
 * runtime-ID uniqueness are handled before emission.
 *
 * Both files use ordinary static imports with their generated extensions. The
 * playable's bundler decides how JSON and image modules are loaded.
 *
 * @param asset - One complete processed atlas sheet containing JSON and texture files.
 * @param context - Module-wide state used to register both generated files.
 * @returns One indented TypeScript source line for the atlas sheet.
 */
export function renderAtlasEntry(asset: ProcessedAtlasAsset, context: AssetsModuleContext): string {
  const atlasDataImport = registerImport(context, 'atlas', asset.files.json.path);
  const textureImport = registerImport(context, 'image', asset.files.image.path);

  return `      ${renderPropertyKey(asset.id)}: { json: ${atlasDataImport}, image: ${textureImport} },`;
}

/**
 * Builds the registry value for every processed atlas sheet in the build.
 *
 * Unlike `renderAtlasEntry`, this function does not produce TypeScript source
 * or register file imports. It turns the frame names retained during atlas
 * processing into a plain nested object. `emitRegistries` later serializes that
 * object into the generated `atlases.ts` module.
 *
 * For example, this input contains two sheets from the build:
 *
 * ```ts
 * [
 *   {
 *     bundle: 'primary',
 *     category: 'atlases',
 *     id: 'ui/menu-0',
 *     files: {
 *       json: {
 *         format: 'json',
 *         path: '/project/assets/generated/atlases/ui/menu-0.json',
 *       },
 *       image: {
 *         format: 'webp',
 *         path: '/project/assets/generated/atlases/ui/menu-0.webp',
 *       },
 *     },
 *     frameNames: ['menu-0/buttons/play', 'menu-0/icons/close'],
 *   },
 *   {
 *     bundle: 'primary',
 *     category: 'atlases',
 *     id: 'ui/menu-1',
 *     files: {
 *       json: {
 *         format: 'json',
 *         path: '/project/assets/generated/atlases/ui/menu-1.json',
 *       },
 *       image: {
 *         format: 'avif',
 *         path: '/project/assets/generated/atlases/ui/menu-1.avif',
 *       },
 *     },
 *     frameNames: ['menu-1/panel'],
 *   },
 * ]
 * ```
 *
 * If `menu-0` retains the frames `menu-0/buttons/play` and
 * `menu-0/icons/close`, while `menu-1` retains `menu-1/panel`, this function
 * returns:
 *
 * ```ts
 * {
 *   'ui/menu-0': {
 *     'buttons/play': 'menu-0/buttons/play',
 *     'icons/close': 'menu-0/icons/close',
 *   },
 *   'ui/menu-1': {
 *     panel: 'menu-1/panel',
 *   },
 * }
 * ```
 *
 * Each outer key is the runtime ID of one generated sheet. Each inner key is
 * the convenient application-facing frame key, while its value remains the
 * exact frame name stored in the generated atlas JSON and expected by the
 * runtime texture-atlas loader.
 *
 * A generated sheet prefix is removed only from the registry key. For example,
 * `menu-0/buttons/play` becomes the key `buttons/play`, but its value remains
 * `menu-0/buttons/play`. A frame without that exact prefix is preserved on both
 * sides. This prevents a generated sheet name from leaking into application
 * code without changing the actual lookup value.
 *
 * Assets arrive in deterministic ID order from the shared emitter grouping
 * step. The processor retained frame names while the packer's JSON was already
 * in memory; this renderer therefore performs no filesystem reads or parsing.
 * Frame names are sorted here before serialization. Bundle membership does not
 * appear in the registry.
 *
 * @param assets - Complete processed atlas sheets across all bundles.
 * @returns A sheet-ID-to-frame-lookup object ready for registry serialization.
 */
export function renderAtlasRegistry(assets: readonly ProcessedAtlasAsset[]): RegistryObject {
  const entries = assets.map((asset) => {
    const frameEntries = [...asset.frameNames]
      .sort((left, right) => left.localeCompare(right))
      .map((frameName) => [stripSheetPrefix(asset.id, frameName), frameName]);

    return [asset.id, Object.fromEntries(frameEntries)] as const;
  });

  return Object.fromEntries(entries);
}

/**
 * Removes one generated sheet-name prefix from an application-facing frame key.
 *
 * For atlas ID `ui/menu-0`, `menu-0/buttons/play` becomes `buttons/play`.
 * `shared/logo` remains `shared/logo` because it does not begin with the exact
 * generated sheet name `menu-0/`.
 */
function stripSheetPrefix(atlasId: string, frameName: string): string {
  const sheetName = atlasId.split('/').at(-1) ?? atlasId;
  const sheetPrefix = `${sheetName}/`;

  return frameName.startsWith(sheetPrefix) ? frameName.slice(sheetPrefix.length) : frameName;
}
