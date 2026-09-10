import { lstatSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

/** Resolves an output path while preventing project-wide recursive deletion. */
export function resolveOutputDirectory(projectRoot: string, configuredPath: string): string {
  const outputDirectory = resolve(projectRoot, configuredPath);
  const projectRelativePath = relative(projectRoot, outputDirectory);

  if (projectRelativePath === '' || isOutsideProject(projectRelativePath)) {
    throw new Error('The build output must resolve to a directory inside the project root.');
  }

  // Resolve existing ancestors too: `linked/dist` may escape even when `dist`
  // does not exist yet. Return the authored path, but validate its physical target.
  const physicalRoot = realpathSync(projectRoot);
  const physicalOutput = resolvePhysicalPath(outputDirectory);
  const physicalRelativePath = relative(physicalRoot, physicalOutput);

  if (physicalRelativePath === '' || isOutsideProject(physicalRelativePath)) {
    throw new Error('The build output must resolve to a directory inside the project root.');
  }

  return outputDirectory;
}

/** Resolves symlinks in the nearest existing ancestor of a future output path. */
function resolvePhysicalPath(path: string): string {
  if (lstatSync(path, { throwIfNoEntry: false }) !== undefined) {
    // Dangling links and permission errors must fail, not bypass the safety check.
    return realpathSync(path);
  }

  const parent = dirname(path);
  return resolve(resolvePhysicalPath(parent), relative(parent, path));
}

/** Identifies relative paths that resolve beyond their intended parent directory. */
function isOutsideProject(relativePath: string): boolean {
  return relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath);
}
