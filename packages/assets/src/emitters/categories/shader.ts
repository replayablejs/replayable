import type { AssetsModuleContext, RegistryObject } from '#types/emission.js';
import type { ProcessedShaderAsset } from '#types/processed-assets.js';

import { registerImport } from '../utils/assets-module.js';
import { renderPropertyKey } from '../utils/object-literal.js';
import { createIdentityRegistry } from '../utils/registry.js';

/**
 * Serializes one processed shader pair as one TypeScript property line inside
 * the generated `assets` object.
 *
 * Resolution has already required the authored `vert.glsl` and `frag.glsl`
 * pair, and processing has copied both files unchanged. This renderer receives
 * one complete logical shader:
 *
 * ```ts
 * {
 *   bundle: 'primary',
 *   category: 'shaders',
 *   id: 'glow',
 *   files: {
 *     vert: {
 *       format: 'glsl',
 *       path: '/project/assets/generated/shaders/glow/vert.glsl',
 *     },
 *     frag: {
 *       format: 'glsl',
 *       path: '/project/assets/generated/shaders/glow/frag.glsl',
 *     },
 *   },
 * }
 * ```
 *
 * With an initially empty module context, the vertex stage is registered first
 * and the fragment stage second:
 *
 * ```ts
 * import shader_0 from '../../assets/generated/shaders/glow/vert.glsl';
 * import shader_1 from '../../assets/generated/shaders/glow/frag.glsl';
 * ```
 *
 * The function then returns one property containing the same semantic stage
 * order:
 *
 * ```ts
 * '      "glow": { vert: shader_0, frag: shader_1 },'
 * ```
 *
 * `vert` and `frag` are explicit runtime fields rather than an order-dependent
 * source array. The renderer adds no `?raw`, `?url`, import attribute, or GLSL
 * interpretation. No build stage validates shader syntax or imposes a GLSL
 * version; the playable's bundler and runtime own how the imports are loaded
 * and compiled.
 *
 * @param asset - One complete processed shader containing both generated stages.
 * @param context - Module-wide state used to register the vertex and fragment files.
 * @returns One indented TypeScript source line for the shader pair.
 */
export function renderShaderEntry(
  asset: ProcessedShaderAsset,
  context: AssetsModuleContext,
): string {
  const vertexShaderImport = registerImport(context, 'shader', asset.files.vert.path);
  const fragmentShaderImport = registerImport(context, 'shader', asset.files.frag.path);

  return `      ${renderPropertyKey(asset.id)}: { vert: ${vertexShaderImport}, frag: ${fragmentShaderImport} },`;
}

/**
 * Builds the logical shader-ID registry for all processed shaders in the build.
 *
 * A processed shader is one runtime asset containing both its vertex and
 * fragment stages. This function therefore registers the shader's logical ID,
 * not separate stage paths. It returns plain registry data; `emitRegistries`
 * later serializes that value into the generated `shaders.ts` module.
 *
 * For example, this input contains two complete shader programs:
 *
 * ```ts
 * [
 *   {
 *     bundle: 'primary',
 *     category: 'shaders',
 *     id: 'dissolve',
 *     files: {
 *       vert: {
 *         format: 'glsl',
 *         path: '/project/assets/generated/shaders/dissolve/vert.glsl',
 *       },
 *       frag: {
 *         format: 'glsl',
 *         path: '/project/assets/generated/shaders/dissolve/frag.glsl',
 *       },
 *     },
 *   },
 *   {
 *     bundle: 'primary',
 *     category: 'shaders',
 *     id: 'grayscale',
 *     files: {
 *       vert: {
 *         format: 'glsl',
 *         path: '/project/assets/generated/shaders/grayscale/vert.glsl',
 *       },
 *       frag: {
 *         format: 'glsl',
 *         path: '/project/assets/generated/shaders/grayscale/frag.glsl',
 *       },
 *     },
 *   },
 * ]
 * ```
 *
 * The function returns:
 *
 * ```ts
 * {
 *   dissolve: 'dissolve',
 *   grayscale: 'grayscale',
 * }
 * ```
 *
 * No `dissolve/vert` or `dissolve/frag` registry values are generated. Runtime
 * code selects the complete shader through `shaders.dissolve`; the
 * generated `assets` entry then provides its explicit `vert` and `frag`
 * imports. Stage paths, GLSL source, and formats belong to that assets module,
 * not to this identity registry.
 *
 * `createIdentityRegistry` sorts shader IDs alphabetically for deterministic
 * generated output. Shader identity has already been validated before
 * emission, and no generated files need to be read to build this lookup.
 * Bundle membership does not appear in the registry.
 *
 * @param assets - Complete processed shader programs across all bundles.
 * @returns A deterministic shader-ID identity lookup ready for serialization.
 */
export function renderShaderRegistry(assets: readonly ProcessedShaderAsset[]): RegistryObject {
  return createIdentityRegistry(assets.map((asset) => asset.id));
}
