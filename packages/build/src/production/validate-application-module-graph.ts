import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, parse } from 'node:path';

import type { ApplicationModuleGraph, PackageInstance } from '#types/module-graph.js';

/**
 * Browser packages whose state or object identity cannot safely be duplicated.
 *
 * This list is intentionally local to `@replayablejs/build`: unlike the repository
 * dependency check, this validator ships to consumers and must work independently.
 */
const SINGLETON_PACKAGES = [
  '@esotericsoftware/spine-core',
  '@esotericsoftware/spine-pixi-v8',
  '@replayablejs/runtime',
  'motion',
  'motion-dom',
  'pixi.js',
] as const;

/**
 * Rejects singleton packages bundled from more than one physical installation.
 *
 * Rolldown may include the same package in several chunks; those modules are
 * valid when their nearest package.json resolves to the same real directory.
 * Distinct directories indicate separate caches, class identities, or frame
 * schedulers that cannot safely coexist inside one playable application.
 *
 * Only the application build belongs here. Replayable deliberately builds host,
 * config, and assets as separate executable entries; combining all four module
 * graphs would confuse that isolation with duplicate browser package instances.
 *
 * A protected package may be absent—for example, a DOM-only playable contains
 * no PixiJS. Presence is enforced by authored imports; this function only rejects
 * multiple installations of a package that actually entered the application.
 */
export function validateApplicationModuleGraph(output: ApplicationModuleGraph): void {
  const packageInstances = new Map<string, Set<string>>();
  const packageCache = new Map<string, PackageInstance | null>();

  for (const chunkOrAsset of output) {
    // Assets contain emitted bytes but no Rolldown module ownership information.
    if (chunkOrAsset.type !== 'chunk') {
      continue;
    }

    // `modules` includes every source contributing to this chunk. The same module
    // may appear in graph reporting more than once, so physical paths enter Sets.
    for (const moduleId of Object.keys(chunkOrAsset.modules)) {
      const packageInstance = resolvePackageInstance(moduleId, packageCache);

      if (!isSingletonPackage(packageInstance?.name)) {
        continue;
      }

      const instances = packageInstances.get(packageInstance.name) ?? new Set<string>();

      instances.add(packageInstance.directory);
      packageInstances.set(packageInstance.name, instances);
    }
  }

  for (const packageName of SINGLETON_PACKAGES) {
    const instances = packageInstances.get(packageName);

    if (instances !== undefined && instances.size > 1) {
      throw new Error(
        `Playable application contains multiple ${packageName} instances: ${[...instances].join(
          ', ',
        )}.`,
      );
    }
  }
}

/** Resolves the nearest package.json that owns one filesystem-backed module. */
function resolvePackageInstance(
  moduleId: string,
  cache: Map<string, PackageInstance | null>,
): PackageInstance | null {
  // Vite queries describe alternate transforms of the same source file and are
  // not part of its filesystem location (`sprite.png?url`, `module.ts?raw`).
  const filePath = moduleId.replace(/[?#].*$/, '');

  // Rolldown also reports virtual module IDs. They have no owning package.json
  // and therefore cannot establish a second physical package installation.
  if (!isAbsolute(filePath)) {
    return null;
  }

  let directory = dirname(filePath);
  const visitedDirectories: string[] = [];

  while (directory !== parse(directory).root) {
    const cachedInstance = cache.get(directory);

    // `null` is deliberately cached as well. `has()` distinguishes a completed
    // negative lookup from a directory that has not been inspected yet.
    if (cachedInstance !== undefined || cache.has(directory)) {
      cacheDirectories(visitedDirectories, cachedInstance ?? null, cache);
      return cachedInstance ?? null;
    }

    visitedDirectories.push(directory);

    const manifestPath = join(directory, 'package.json');

    if (existsSync(manifestPath)) {
      // The nearest manifest owns the module. Walking beyond it could incorrectly
      // attribute an application source file to a parent workspace package.
      const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const packageInstance = readPackageInstance(manifest, directory);

      cacheDirectories(visitedDirectories, packageInstance, cache);
      return packageInstance;
    }

    directory = dirname(directory);
  }

  cacheDirectories(visitedDirectories, null, cache);
  return null;
}

/**
 * Retains one package lookup for every traversed directory.
 *
 * Many modules share nested directories. Caching the whole walk prevents repeated
 * filesystem traversal for every file in a large dependency such as PixiJS.
 */
function cacheDirectories(
  directories: readonly string[],
  packageInstance: PackageInstance | null,
  cache: Map<string, PackageInstance | null>,
): void {
  for (const directory of directories) {
    cache.set(directory, packageInstance);
  }
}

/** Reads only the package identity required by singleton validation. */
function readPackageInstance(manifest: unknown, directory: string): PackageInstance | null {
  if (
    typeof manifest !== 'object' ||
    manifest === null ||
    !('name' in manifest) ||
    typeof manifest.name !== 'string'
  ) {
    return null;
  }

  return {
    // Different symlink spellings of one pnpm/workspace package must compare equal.
    directory: realpathSync.native(directory),
    name: manifest.name,
  };
}

/** Narrows an arbitrary package name to the protected singleton set. */
function isSingletonPackage(name: string | undefined): name is string {
  return name !== undefined && SINGLETON_PACKAGES.some((packageName) => packageName === name);
}
