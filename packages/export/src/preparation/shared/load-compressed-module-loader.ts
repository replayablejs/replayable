import { readFile } from 'node:fs/promises';

import { prepareExportJavaScript } from './prepare-javascript.js';

const COMPRESSED_MODULE_LOADER_PATH = new URL(
  './browser/compressed-module-loader.js',
  import.meta.url,
);

let compressedModuleLoaderSource: Promise<string> | undefined;

/**
 * Loads and prepares Replayable's compiled browser-side module loader.
 *
 * The promise caches both the file read and export preparation so concurrently
 * generated variants share the same immutable minified source.
 */
export function loadCompressedModuleLoader(): Promise<string> {
  compressedModuleLoaderSource ??= readFile(COMPRESSED_MODULE_LOADER_PATH, 'utf8').then((source) =>
    prepareExportJavaScript(source, 'module'),
  );

  return compressedModuleLoaderSource;
}
