import { realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import { resolveCanonicalPath } from '#shared/canonical-path.js';
import type { ExportDirectories } from '#types/directories.js';

const DEFAULT_OUTPUT_DIRECTORY = 'exports';

/**
 * Resolves and validates the two generated roots used by export.
 *
 * Both directories must remain inside the project, and neither may contain the
 * other. This prevents the emission cleanup from deleting source builds. For
 * example, "dist" and "exports" are valid siblings, while "dist/exports" is not.
 */
export async function resolveExportDirectories(
  projectRoot: string,
  buildOutputPath: string,
  exportOutputPath = DEFAULT_OUTPUT_DIRECTORY,
): Promise<ExportDirectories> {
  const canonicalProjectRoot = await realpath(projectRoot);
  const directories = {
    buildOutput: await resolveGeneratedDirectory(canonicalProjectRoot, buildOutputPath),
    exportOutput: await resolveGeneratedDirectory(canonicalProjectRoot, exportOutputPath),
  };

  assertDirectoriesDoNotOverlap(directories);

  return directories;
}

/** Resolves one generated root and rejects the project root or paths outside it. */
async function resolveGeneratedDirectory(
  projectRoot: string,
  configuredPath: string,
): Promise<string> {
  const directory = await resolveCanonicalPath(resolve(projectRoot, configuredPath));
  const projectRelativePath = relative(projectRoot, directory);
  const escapesProject =
    projectRelativePath === '..' ||
    projectRelativePath.startsWith(`..${sep}`) ||
    isAbsolute(projectRelativePath);

  if (projectRelativePath === '' || escapesProject) {
    throw new Error(`Generated directory must be inside the project root: ${configuredPath}.`);
  }

  return directory;
}

/** Prevents export cleanup from removing builds or writing artifacts inside them. */
function assertDirectoriesDoNotOverlap(directories: ExportDirectories): void {
  if (
    containsDirectory(directories.buildOutput, directories.exportOutput) ||
    containsDirectory(directories.exportOutput, directories.buildOutput)
  ) {
    throw new Error('The build and export directories must not overlap.');
  }
}

/**
 * Reports whether "parent" contains "child", including equality.
 *
 * For example, "/project/dist" contains "/project/dist/google", but it does not
 * contain the sibling "/project/exports".
 */
function containsDirectory(parent: string, child: string): boolean {
  const childPath = relative(parent, child);

  return (
    childPath === '' ||
    (childPath !== '..' && !childPath.startsWith(`..${sep}`) && !isAbsolute(childPath))
  );
}
