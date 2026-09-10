import { relative, sep } from 'node:path';

import type { AssetsModuleContext } from '#types/emission.js';

/**
 * Registers one generated file and returns its unique local import identifier.
 *
 * Asset renderers serialize object property lines but do not write import
 * statements. They share one `AssetsModuleContext` and register every file
 * referenced by those lines. If three imports already exist, registering a
 * background image with the prefix `image` performs two related operations:
 *
 * 1. Append this description to `context.imports`:
 *
 *      { name: 'image_3', path: '../../assets/out/background.webp' }
 *
 * 2. Return `'image_3'` so the renderer can reference it:
 *
 *      "background": { src: image_3, scale: 1 },
 *
 * `emitAssetsModule` serializes all asset entries first, which registers every
 * required import. It then writes the accumulated imports above the generated
 * `assets` object:
 *
 *   import image_3 from "../../assets/out/background.webp";
 *
 * Numbering belongs to the complete generated module rather than an individual
 * category. An atlas import followed by an image import can therefore become
 * `atlas_0` and `image_1`. The emitter processes bundles, categories and assets
 * deterministically, so these identifiers remain stable across builds.
 *
 * Every file uses the same ordinary static-import shape. This context does not
 * attach loading instructions based on extensions or asset categories; the
 * playable's bundler owns those decisions. Every call registers a distinct
 * import. This function does not inspect files, emit source code or deduplicate
 * paths; each renderer decides which generated files its runtime entry
 * references.
 *
 * @returns The unique local identifier reserved for the generated import.
 */
export function registerImport(
  context: AssetsModuleContext,
  prefix: string,
  absolutePath: string,
): string {
  // The accumulator length is a module-wide monotonic counter. Prefixes keep
  // generated identifiers recognizable without requiring separate counters.
  const name = `${prefix}_${context.imports.length}`;

  // Retain structured data until final assembly so statement formatting and
  // path quoting remain centralized in emitAssetsModule.
  context.imports.push({
    name,
    path: resolveModulePath(context.fromDirectory, absolutePath),
  });

  return name;
}

/** Resolves one generated file relative to the module that references it. */
export function resolveModulePath(fromDirectory: string, toFile: string): string {
  // Convert the absolute output path into a module specifier relative to the
  // directory containing the generated assets module:
  //
  //   module directory: /project/src/assets
  //   file: /project/assets/out/logo.webp
  //     -> ../../assets/out/logo.webp
  const path = relative(fromDirectory, toFile).split(sep).join('/');

  // Module specifiers use forward slashes on every operating system. Node's
  // `relative` returns a bare filename for files in the same directory, so add
  // `./` to prevent that filename from being interpreted as a package name.
  return path.startsWith('.') ? path : `./${path}`;
}
