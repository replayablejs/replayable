import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Packages whose identity is observable at runtime rather than merely their API.
 *
 * - Replayable integrations must all address the same `playable` facade.
 * - Motion and motion-dom must retain one shared frame scheduler.
 * - Pixi objects, caches, extensions, and `Ticker.shared` must belong to one Pixi runtime.
 * - Spine objects, parsers, texture caches, and renderer integrations must
 *   belong to one Spine-Pixi package and one compatible Spine core runtime.
 *
 * This list is intentionally repeated by the published build package. This
 * repository script must run before that package is built, while the build-time
 * validator must remain independently usable after publication.
 */
const SINGLETON_PACKAGES = [
  '@esotericsoftware/spine-core',
  '@esotericsoftware/spine-pixi-v8',
  '@replayablejs/runtime',
  'motion',
  'motion-dom',
  'pixi.js',
] as const;

type SingletonPackage = (typeof SINGLETON_PACKAGES)[number];

interface PackageInstance {
  /** Canonical installation location after resolving workspace and pnpm symlinks. */
  readonly path: string;
  /** Version retained only to make a failure actionable. */
  readonly version: string;
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageManagerPath = process.env.npm_execpath;

if (packageManagerPath === undefined) {
  throw new Error('Run this check through pnpm dependencies:check.');
}

// Invoke the exact pnpm executable that started this package script. Calling
// `pnpm` by name would depend on platform-specific PATH shims, particularly on
// Windows. The recursive output contains every workspace importer and its
// dependency tree; filtering keeps the JSON limited to the protected packages.
const dependencyGraph: unknown = JSON.parse(
  execFileSync(
    process.execPath,
    [
      packageManagerPath,
      'list',
      ...SINGLETON_PACKAGES,
      '--recursive',
      '--depth',
      'Infinity',
      '--json',
    ],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
    },
  ),
);

const packageInstances = collectPackageInstances(dependencyGraph);

// A workspace check requires exactly one instance—not merely at most one.
// Absence usually means the lockfile or installation is incomplete and should
// fail just as clearly as two incompatible installations.
for (const packageName of SINGLETON_PACKAGES) {
  const instances = packageInstances.get(packageName) ?? new Map();

  if (instances.size !== 1) {
    const resolvedInstances =
      instances.size === 0
        ? 'none'
        : [...instances.values()].map(({ path, version }) => `${version} at ${path}`).join(', ');

    throw new Error(
      `Expected one ${packageName} instance; found ${instances.size}: ${resolvedInstances}.`,
    );
  }
}

console.log(`Dependency singletons verified: ${SINGLETON_PACKAGES.join(', ')}.`);

/** Collects every singleton installation in one traversal of pnpm's dependency graph. */
function collectPackageInstances(
  graph: unknown,
): Map<SingletonPackage, Map<string, PackageInstance>> {
  const instancesByPackage = new Map<SingletonPackage, Map<string, PackageInstance>>();

  visit(graph);

  return instancesByPackage;

  /**
   * Visits pnpm's nested, intentionally untrusted JSON structure.
   *
   * Project records identify themselves with `name`; dependency records use
   * `from`. The same physical package commonly appears many times as a deduped
   * dependency, so the result is keyed by canonical path rather than occurrence.
   */
  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }

      return;
    }

    if (!isRecord(value)) {
      return;
    }

    const resolvedName = typeof value.from === 'string' ? value.from : value.name;

    if (isSingletonPackage(resolvedName) && typeof value.path === 'string') {
      // Workspace links and node_modules symlinks can spell the same installation
      // differently. realpathSync makes those references one package instance.
      const physicalPath = realpathSync(value.path);
      const instances = instancesByPackage.get(resolvedName) ?? new Map();

      instances.set(physicalPath, {
        path: physicalPath,
        version: typeof value.version === 'string' ? value.version : 'unknown',
      });
      instancesByPackage.set(resolvedName, instances);
    }

    for (const child of Object.values(value)) {
      visit(child);
    }
  }
}

/** Narrows pnpm's untrusted JSON value to a protected package name. */
function isSingletonPackage(value: unknown): value is SingletonPackage {
  return SINGLETON_PACKAGES.some((packageName) => packageName === value);
}

/** Narrows arbitrary JSON objects without asserting their property shape. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
