import { extname } from 'node:path';

import type { AssetMode } from '@replayablejs/runtime/assets';
import type { Plugin } from 'vite';

import type { GeneratedAssetsPluginOptions, GeneratedImportKind } from '#types/vite.js';
import { resolvePhysicalId } from '#vite/resolve-physical-id.js';

const BINARY_EXTENSIONS = new Set([
  '.avif',
  '.glb',
  '.gltf',
  '.jpeg',
  '.jpg',
  '.m4a',
  '.mp3',
  '.ogg',
  '.png',
  '.skel',
  '.wav',
  '.webp',
  '.woff',
  '.woff2',
]);
const JSON_EXTENSION = '.json';
const TEXT_EXTENSIONS = new Set(['.atlas', '.frag', '.glsl', '.vert']);

const INLINE_QUERY_BY_KIND = {
  binary: '?url&inline',
  json: undefined,
  text: '?raw',
} satisfies Record<GeneratedImportKind, string | undefined>;

/**
 * Applies a profile's asset policy through Vite's native import queries.
 *
 * The generated assets module stays independent of Vite and contains ordinary
 * imports such as:
 *
 * ```ts
 * import image from './resources/logo.webp';
 * import shader from './resources/frag.glsl';
 * import locale from './resources/translations.json';
 * ```
 *
 * Before Vite resolves those imports, this plugin privately attaches the query
 * that describes the required runtime representation:
 *
 * | Imported file       | Inline mode   | Resource mode    |
 * | ------------------- | ------------- | ---------------- |
 * | Image/audio/font    | `?url&inline` | `?url&no-inline` |
 * | Binary SKEL         | `?url&inline` | `?url&no-inline` |
 * | GLSL/Spine atlas    | `?raw`        | `?url&no-inline` |
 * | JSON                | ordinary JSON | `?url&no-inline` |
 *
 * Only direct imports made by the generated assets module are rewritten.
 * Authored application imports and unrelated JSON or text files retain Vite's
 * normal behavior.
 */
export function createGeneratedAssetsPlugin(options: GeneratedAssetsPluginOptions): Plugin {
  const assetsModule = resolvePhysicalId(options.assetsModule);

  return {
    name: 'replayable:generated-assets',
    enforce: 'pre',

    async resolveId(source, importer) {
      if (importer === undefined || resolvePhysicalId(importer) !== assetsModule) {
        return undefined;
      }

      const importKind = classifyGeneratedImport(source);

      if (importKind === undefined) {
        return undefined;
      }

      const query = resolveViteQuery(importKind, options.mode);

      // Inline JSON deliberately reaches Vite unchanged so its native JSON
      // module handling returns the parsed object.
      if (query === undefined) {
        return undefined;
      }

      // Resolve the rewritten import through Vite while preventing this plugin
      // from intercepting its own query-enhanced request a second time.
      return this.resolve(`${source}${query}`, importer, { skipSelf: true });
    },
  };
}

/** Classifies one physical import emitted by the generated assets module. */
function classifyGeneratedImport(source: string): GeneratedImportKind | undefined {
  const extension = extname(resolvePhysicalId(source)).toLowerCase();

  if (BINARY_EXTENSIONS.has(extension)) {
    return 'binary';
  }

  if (TEXT_EXTENSIONS.has(extension)) {
    return 'text';
  }

  return extension === JSON_EXTENSION ? 'json' : undefined;
}

/** Selects the documented Vite query for one asset kind and delivery mode. */
function resolveViteQuery(kind: GeneratedImportKind, mode: AssetMode): string | undefined {
  return mode === 'resource' ? '?url&no-inline' : INLINE_QUERY_BY_KIND[kind];
}
