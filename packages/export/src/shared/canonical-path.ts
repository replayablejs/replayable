import { realpath } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';

import { isMissingPathError } from './filesystem-error.js';

/**
 * Resolves symlinks in the existing portion of a path.
 *
 * Generated directories commonly do not exist yet. In that case, the nearest
 * existing ancestor is canonicalized and the missing path segments are appended
 * unchanged. For example, if "generated" is a symlink, resolving
 * "generated/exports" exposes its real destination before cleanup can use it.
 */
export async function resolveCanonicalPath(path: string): Promise<string> {
  const missingSegments: string[] = [];
  let existingPath = path;

  while (true) {
    try {
      const canonicalPath = await realpath(existingPath);

      return resolve(canonicalPath, ...missingSegments);
    } catch (error) {
      if (!isMissingPathError(error)) {
        throw error;
      }
    }

    const parent = dirname(existingPath);

    if (parent === existingPath) {
      throw new Error(`Unable to resolve an existing ancestor for generated path: ${path}.`);
    }

    missingSegments.unshift(basename(existingPath));
    existingPath = parent;
  }
}
