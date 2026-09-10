import { isAbsolute, relative, resolve, sep } from 'node:path';

import type { AssetConfig } from '#types/config.js';
import type { BuildContext } from '#types/context.js';

/**
 * Resolves configured project-relative paths into validated absolute paths.
 *
 * All generated paths must stay inside the project, and authored sources must
 * remain separate from every generated tree. Registries may live inside
 * `outDir` when the complete output tree is owned by Replayable. These checks
 * protect authored files when the completed build replaces the previous output.
 * Filesystem symlink checks run separately before staging and publication.
 */
export function createBuildContext(config: AssetConfig, workingDirectory: string): BuildContext {
  const workspaceRoot = resolve(workingDirectory);
  const sourceRoot = resolve(workspaceRoot, config.sourceDir);
  const outputRoot = resolve(workspaceRoot, config.outDir);
  const assetsFile = resolve(workspaceRoot, config.emit.assets);
  const registriesDirectory =
    config.emit.registries === undefined
      ? undefined
      : resolve(workspaceRoot, config.emit.registries);

  assertSafeProjectPath(workspaceRoot, sourceRoot, 'sourceDir');
  assertSafeProjectPath(workspaceRoot, outputRoot, 'outDir');
  assertSafeProjectPath(workspaceRoot, assetsFile, 'emit.assets');

  if (registriesDirectory !== undefined) {
    assertSafeProjectPath(workspaceRoot, registriesDirectory, 'emit.registries');
  }

  if (pathsOverlap(sourceRoot, outputRoot)) {
    throw new Error('outDir and sourceDir must be separate, non-nested directories.');
  }

  if (pathsOverlap(assetsFile, sourceRoot)) {
    throw new Error('emit.assets must be separate from sourceDir.');
  }

  if (pathsOverlap(assetsFile, outputRoot) && !isNestedInside(assetsFile, outputRoot)) {
    throw new Error('emit.assets must be separate from or nested inside outDir.');
  }

  if (registriesDirectory !== undefined && pathsOverlap(registriesDirectory, sourceRoot)) {
    throw new Error('emit.registries must be separate from sourceDir.');
  }

  if (registriesDirectory !== undefined) {
    const registriesNestedInsideOutput = isNestedInside(registriesDirectory, outputRoot);

    if (pathsOverlap(registriesDirectory, outputRoot) && !registriesNestedInsideOutput) {
      throw new Error('emit.registries must be separate from or nested inside outDir.');
    }

    if (pathsOverlap(assetsFile, registriesDirectory)) {
      throw new Error('emit.assets must be separate from emit.registries.');
    }
  }

  return {
    assetsFile,
    outputRoot,
    registriesDirectory,
    sourceRoot,
  };
}

/** Returns whether `target` is strictly nested beneath `directory`. */
function isNestedInside(target: string, directory: string): boolean {
  return target.startsWith(`${directory}${sep}`);
}

function pathsOverlap(left: string, right: string): boolean {
  // Equality and either nesting direction count as overlap.
  return left === right || left.startsWith(`${right}${sep}`) || right.startsWith(`${left}${sep}`);
}

function assertSafeProjectPath(workingDirectory: string, target: string, field: string): void {
  const pathFromWorkingDirectory = relative(workingDirectory, target);

  // An empty relative path is the project root itself. `..` and `../...`
  // identify paths outside it. None are safe cleanup or generation targets.
  if (
    pathFromWorkingDirectory === '' ||
    isAbsolute(pathFromWorkingDirectory) ||
    pathFromWorkingDirectory === '..' ||
    pathFromWorkingDirectory.startsWith(`..${sep}`)
  ) {
    throw new Error(`${field} must resolve to a path inside the project directory.`);
  }
}
