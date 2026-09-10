import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const PAKO_INFLATER_PATH = require.resolve('pako/dist/pako_inflate.min.js');

let pakoInflaterSource: Promise<string> | undefined;

/**
 * Loads Pako's official inflate-only browser distribution.
 *
 * The source is cached because every single-HTML variant uses the same immutable
 * dependency file. Keeping the promise also shares an in-progress read when
 * several variants are prepared concurrently.
 */
export function loadPakoInflater(): Promise<string> {
  pakoInflaterSource ??= readFile(PAKO_INFLATER_PATH, 'utf8');

  return pakoInflaterSource;
}
