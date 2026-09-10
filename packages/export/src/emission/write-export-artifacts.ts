import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

import { resolveCanonicalPath } from '#shared/canonical-path.js';
import { isMissingPathError } from '#shared/filesystem-error.js';
import type { PreparedExportArtifact } from '#types/artifact.js';

/**
 * Writes every prepared artifact before replacing the last successful export directory.
 *
 * The caller has already prepared the HTML/ZIP bytes and resolved unique, flat
 * output filenames. This function only handles filesystem delivery; it does not
 * build, compress, validate, or rename individual network artifacts.
 *
 * Delivery has three stages:
 * 1. Write all new files into a temporary sibling directory. Existing exports stay
 *    untouched while those writes run, including when a write fails.
 * 2. Move the existing export directory into a backup, then move the completed
 *    replacement into its final location. Old files are replaced as a set, not merged.
 * 3. Remove the temporary directory and the now-obsolete backup after success.
 *
 * If installing the replacement fails, restore the backup before rejecting. If
 * restoration also fails, keep the backup and report its path in an AggregateError
 * containing both failures. Cleanup must never delete that remaining recovery copy.
 *
 * This is recovery for awaited filesystem failures, not a crash-safe transaction
 * or a lock against concurrent exporters. The destination is briefly absent between
 * the two renames; process termination during that interval cannot run rollback.
 *
 * @param outputDirectory - Canonical absolute destination resolved by the export pipeline.
 * @param artifacts - Complete replacement set, with unique filenames assigned by resolution.
 * An empty set intentionally produces an empty export directory.
 *
 * @example Temporary paths when replacing a project's `exports` directory:
 * ```text
 * basic-playable/
 *   exports/                         Previous delivery files, until replacement starts
 *   .exports-staging-<unique>/        Temporary sibling owned by this operation
 *     prepared/                      New applovin_default_en.html, google_default_en.zip, ...
 *     previous/                      Old exports, moved here immediately before replacement
 * ```
 * On success, `prepared` becomes `exports`, and the temporary sibling is removed.
 */
export async function writeExportArtifacts(
  outputDirectory: string,
  artifacts: readonly PreparedExportArtifact[],
): Promise<void> {
  const parent = dirname(outputDirectory);
  // Resolution already checked this destination. Check again before creating
  // temporary files, in case an intermediate directory has become a symlink.
  await assertOutputDirectoryUnchanged(outputDirectory);
  await mkdir(parent, { recursive: true });
  // A unique sibling keeps temporary files out of the delivery directory and
  // ordinarily on the same filesystem, allowing directory renames rather than copies.
  const stagingDirectory = await mkdtemp(join(parent, `.${basename(outputDirectory)}-staging-`));
  const preparedDirectory = join(stagingDirectory, 'prepared');
  const backupDirectory = join(stagingDirectory, 'previous');
  // This is a cleanup guard, not an indication that a previous export exists.
  // It becomes true only when rollback fails and the backup must remain recoverable.
  let preserveBackup = false;

  try {
    await mkdir(preparedDirectory);
    // Only the basename is used: resolution has already assigned unique flat names.
    // Sequential writes ensure no pending write can race cleanup after a failure.
    // Until all writes finish, the existing destination is never moved or deleted.
    for (const artifact of artifacts) {
      await writeFile(join(preparedDirectory, basename(artifact.outputFile)), artifact.content);
    }

    // Writing may take time. Recheck the destination before moving the old exports.
    await assertOutputDirectoryUnchanged(outputDirectory);
    const hasPreviousExport = await movePreviousExport(outputDirectory, backupDirectory);

    try {
      // All new files are complete. Publish the entire prepared directory at once.
      await rename(preparedDirectory, outputDirectory);
    } catch (error) {
      if (hasPreviousExport) {
        try {
          // Replacement failed after the old directory moved aside. Put it back
          // at the original path so the last successful exports remain usable.
          await rename(backupDirectory, outputDirectory);
        } catch (restoreError) {
          preserveBackup = true;
          // Both failures are preserved as members; neither replaces the other.
          // oxlint-disable-next-line preserve-caught-error
          throw new AggregateError(
            [error, restoreError],
            `Export replacement failed. Previous exports remain at ${backupDirectory}.`,
            { cause: restoreError },
          );
        }
      }
      // Successful rollback does not make this export successful. Report the
      // replacement error; on a first export, there was simply nothing to restore.
      throw error;
    }
  } finally {
    if (!preserveBackup) {
      // Success: remove the obsolete backup. Write/replacement failure: remove
      // incomplete new files. After successful rollback, the old files are already
      // outside this directory again. Cleanup failures still reject the operation.
      await rm(stagingDirectory, { recursive: true, force: true });
    }
  }
}

/**
 * Moves an existing destination into the operation's backup directory.
 *
 * Returns true only after the move succeeds, allowing the caller to attempt rollback.
 * A missing path returns false (normally the first export). Permission, device, and
 * other filesystem errors propagate; they must not be treated as an absent export.
 */
async function movePreviousExport(
  outputDirectory: string,
  backupDirectory: string,
): Promise<boolean> {
  try {
    await rename(outputDirectory, backupDirectory);
    return true;
  } catch (error) {
    if (isMissingPathError(error)) {
      return false;
    }
    throw error;
  }
}

/**
 * Detects a symlink introduced after resolution and before directory replacement.
 *
 * Resolution stores the canonical destination. Resolving it again immediately
 * before staging and replacement detects an intermediate path redirected since then.
 * Reject rather than move a directory belonging to that new target. This check
 * does not lock the path or prevent another process changing it after the check.
 */
async function assertOutputDirectoryUnchanged(outputDirectory: string): Promise<void> {
  const currentOutputDirectory = await resolveCanonicalPath(outputDirectory);

  if (currentOutputDirectory !== outputDirectory) {
    throw new Error(`Refusing to clean a redirected export directory: ${outputDirectory}.`);
  }
}
