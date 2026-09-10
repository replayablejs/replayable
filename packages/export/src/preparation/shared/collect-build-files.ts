import { readdir, readFile } from 'node:fs/promises';
import { posix, relative, resolve, sep } from 'node:path';

import type { ExportFile } from '#types/export-file.js';

/**
 * Collects one build directory as files ready for network-specific preparation.
 *
 * Given `dist/default/google/en` as the build directory:
 *
 * - `dist/default/google/en/index.html` becomes `{ path: 'index.html', data }`
 * - `dist/default/google/en/assets/main.js` becomes `{ path: 'assets/main.js', data }`
 *
 * Paths always use forward slashes and are sorted before their bytes are read,
 * producing the same ordered result on macOS, Linux, and Windows.
 */
export async function collectBuildFiles(buildDirectory: string): Promise<ExportFile[]> {
  // Discover the complete directory tree in one filesystem operation, then keep
  // only regular files because directories are implicit in export paths.
  const entries = await readdir(buildDirectory, {
    recursive: true,
    withFileTypes: true,
  });

  // Convert absolute host paths into portable paths relative to the export root.
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const file = resolve(entry.parentPath, entry.name);

      return {
        path: relative(buildDirectory, file).split(sep).join(posix.sep),
        file,
      };
    })
    .sort(compareExportFiles);

  // Read independent files concurrently. Promise.all preserves the sorted input
  // order, so parallel I/O does not affect deterministic export construction.
  return Promise.all(
    files.map(async ({ path, file }) => ({
      path,
      data: await readFile(file),
    })),
  );
}

/** Orders export files by code point, independently of host locale. */
function compareExportFiles(left: { path: string }, right: { path: string }): number {
  if (left.path < right.path) {
    return -1;
  }

  if (left.path > right.path) {
    return 1;
  }

  return 0;
}
