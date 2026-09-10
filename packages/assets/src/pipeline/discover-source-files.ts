import type { Stats } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import { glob } from 'tinyglobby';

import type { SourceFile } from '#types/source.js';

/**
 * Recursively discovers regular files beneath the configured source directory.
 *
 * Returned paths contain both an absolute filesystem location for reading and
 * a POSIX-style relative path for platform-independent matching and asset IDs.
 * Results are sorted so later resolution is deterministic on every filesystem.
 */
export async function discoverSourceFiles(sourceRoot: string): Promise<SourceFile[]> {
  await assertSourceDirectory(sourceRoot);

  const relativePaths = await glob('**/*', {
    cwd: sourceRoot,
    onlyFiles: true,
    dot: true,
    followSymbolicLinks: false,
  });

  // Tinyglobby returns cwd-relative paths with POSIX separators, so they can
  // be used directly for cross-platform rule matching and runtime IDs.
  return relativePaths.sort().map((relativePath) => ({
    absolutePath: resolve(sourceRoot, relativePath),
    relativePath,
  }));
}

/** Ensures discovery starts from an existing directory rather than a file. */
async function assertSourceDirectory(sourceRoot: string): Promise<void> {
  let sourceStats: Stats;

  try {
    sourceStats = await stat(sourceRoot);
  } catch (error) {
    if (hasCode(error, 'ENOENT')) {
      throw new Error(`Asset source directory does not exist: ${sourceRoot}`, { cause: error });
    }

    throw error;
  }

  if (!sourceStats.isDirectory()) {
    throw new Error(`Asset source path is not a directory: ${sourceRoot}`);
  }
}

function hasCode(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === code;
}
