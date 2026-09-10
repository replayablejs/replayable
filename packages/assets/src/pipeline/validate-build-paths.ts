import { lstat } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';

import type { BuildContext } from '#types/context.js';

/**
 * Rejects symlinks below the project root before reading or replacing build trees.
 * Lexical containment alone cannot protect `linked-directory/generated`: an
 * existing parent may point outside the project or back into authored sources.
 * The project root itself may be a symlink; paths beneath it may not be.
 * This checks the current filesystem, not concurrent hostile filesystem changes.
 */
export async function validateBuildPaths(
  context: BuildContext,
  projectRoot: string,
): Promise<void> {
  const paths = [context.sourceRoot, context.outputRoot, context.assetsFile];
  if (context.registriesDirectory !== undefined) {
    paths.push(context.registriesDirectory);
  }

  for (const path of paths) {
    let parent = resolve(projectRoot);
    for (const segment of relative(parent, path).split(sep)) {
      parent = resolve(parent, segment);
      const entry = await lstat(parent).catch((error: unknown) => {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          return undefined;
        }
        throw error;
      });
      if (entry === undefined) {
        break;
      }
      if (entry.isSymbolicLink()) {
        throw new Error(`Asset build paths must not contain symbolic links: ${parent}`);
      }
    }
  }
}
