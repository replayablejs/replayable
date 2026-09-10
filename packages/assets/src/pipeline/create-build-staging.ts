import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';

import type { BuildContext } from '#types/context.js';
import type { AssetBuildStaging, AssetOutputReplacement } from '#types/staging.js';

import { validateBuildPaths } from './validate-build-paths.js';

/**
 * Keeps the last successful outputs untouched while a replacement is built.
 * The temporary `prepared` tree mirrors project-relative destinations, so
 * generated relative imports remain correct after publication. Sources still
 * point at the authored tree; only output paths are redirected.
 *
 * Output roots may be separate or contain generated modules. Only non-nested
 * roots are moved, preventing a module from being installed twice. Publication
 * backs up old roots and restores them on failure. Failed restoration retains
 * the recovery directory and reports its path instead of deleting the backup.
 * This is failure recovery, not a crash-safe transaction or a concurrent-build lock.
 */
export async function createBuildStaging(
  context: BuildContext,
  workingDirectory: string,
): Promise<AssetBuildStaging> {
  const projectRoot = resolve(workingDirectory);
  await validateBuildPaths(context, projectRoot);
  const directory = await mkdtemp(join(projectRoot, '.replayable-assets-'));
  const preparedRoot = join(directory, 'prepared');
  let preserveBackup = false;

  const stagedContext: BuildContext = {
    sourceRoot: context.sourceRoot,
    outputRoot: stagePath(context.outputRoot),
    assetsFile: stagePath(context.assetsFile),
    registriesDirectory:
      context.registriesDirectory === undefined
        ? undefined
        : stagePath(context.registriesDirectory),
  };
  const destinations = [context.outputRoot, context.assetsFile];
  if (context.registriesDirectory !== undefined) {
    destinations.push(context.registriesDirectory);
  }
  const replacements: AssetOutputReplacement[] = destinations
    .filter((path) => !destinations.some((parent) => path.startsWith(`${parent}${sep}`)))
    .map((destination, index) => ({
      destination,
      prepared: stagePath(destination),
      backup: join(directory, 'previous', String(index)),
      backedUp: false,
      installed: false,
    }));

  return { context: stagedContext, commit, dispose };

  /** Preserves the relative distance between every generated module and asset. */
  function stagePath(path: string): string {
    return join(preparedRoot, relative(projectRoot, path));
  }

  /** Publishes completed outputs, undoing earlier replacements if a later one fails. */
  async function commit(): Promise<void> {
    await validateBuildPaths(context, projectRoot);
    // Empty builds still own an empty processed directory and remove stale files.
    await mkdir(stagedContext.outputRoot, { recursive: true });
    await mkdir(join(directory, 'previous'));

    try {
      for (const replacement of replacements) {
        await mkdir(dirname(replacement.destination), { recursive: true });
        replacement.backedUp = await backupOutput(replacement);
        await rename(replacement.prepared, replacement.destination);
        replacement.installed = true;
      }
    } catch (error) {
      const restoreErrors = await restoreOutputs(replacements);
      if (restoreErrors.length > 0) {
        preserveBackup = true;
        // Both the publication cause and every restoration failure are retained.
        // oxlint-disable-next-line preserve-caught-error
        throw new AggregateError(
          [error, ...restoreErrors],
          `Asset publication failed. Recovery files remain at ${directory}.`,
          { cause: error },
        );
      }
      throw error;
    }
  }

  /** Removes staged files and obsolete backups, never a required recovery copy. */
  async function dispose(): Promise<void> {
    if (!preserveBackup) {
      await rm(directory, { recursive: true, force: true });
    }
  }
}

/** Only a missing destination means there is no previous output to preserve. */
async function backupOutput(replacement: AssetOutputReplacement): Promise<boolean> {
  try {
    await rename(replacement.destination, replacement.backup);
    return true;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/** Attempts every rollback in reverse publication order, retaining all failures. */
async function restoreOutputs(replacements: readonly AssetOutputReplacement[]): Promise<unknown[]> {
  const errors: unknown[] = [];
  for (const replacement of [...replacements].reverse()) {
    try {
      if (replacement.installed) {
        await rm(replacement.destination, { recursive: true, force: true });
      }
      if (replacement.backedUp) {
        await rename(replacement.backup, replacement.destination);
      }
    } catch (error) {
      errors.push(error);
    }
  }
  return errors;
}
