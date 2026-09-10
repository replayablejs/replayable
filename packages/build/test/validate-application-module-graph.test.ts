import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { validateApplicationModuleGraph } from '../src/production/validate-application-module-graph.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('application module graph validation', () => {
  it('accepts one physical package used by several chunks', async () => {
    const runtime = await createPackage('@replayablejs/runtime', 'runtime');

    expect(() =>
      validateApplicationModuleGraph([
        createChunk(runtime.modulePath),
        createChunk(`${runtime.modulePath}?commonjs-proxy`),
        { type: 'asset' },
      ]),
    ).not.toThrow();
  });

  it('treats symlinked paths as one installation and ignores virtual modules', async () => {
    const pixi = await createPackage('pixi.js', 'pixi');
    const linkedDirectory = join(pixi.testDirectory, 'linked-pixi');

    await symlink(pixi.packageDirectory, linkedDirectory, 'dir');

    expect(() =>
      validateApplicationModuleGraph([
        createChunk(pixi.modulePath, join(linkedDirectory, 'src', 'index.js'), '\0virtual:entry'),
      ]),
    ).not.toThrow();
  });

  it('accepts an application when optional singleton packages are absent', () => {
    expect(() =>
      validateApplicationModuleGraph([createChunk('/application/src/main.ts')]),
    ).not.toThrow();
  });

  it.each([
    '@esotericsoftware/spine-core',
    '@esotericsoftware/spine-pixi-v8',
    '@replayablejs/runtime',
    'motion',
    'motion-dom',
    'pixi.js',
  ])('rejects separate %s installations', async (packageName) => {
    const first = await createPackage(packageName, 'first');
    const second = await createPackage(packageName, 'second');

    expect(() =>
      validateApplicationModuleGraph([createChunk(first.modulePath, second.modulePath)]),
    ).toThrow(
      `Playable application contains multiple ${packageName} instances: ${first.packageDirectory}, ${second.packageDirectory}.`,
    );
  });
});

/** Creates the minimum module-bearing output consumed by the validator. */
function createChunk(...moduleIds: readonly string[]) {
  return {
    modules: Object.fromEntries(moduleIds.map((moduleId) => [moduleId, {}])),
    type: 'chunk' as const,
  };
}

/** Creates one real package installation so ownership and symlinks use the actual filesystem. */
async function createPackage(packageName: string, label: string) {
  const testDirectory = await mkdtemp(join(tmpdir(), 'replayable-module-graph-'));
  const packageDirectory = join(testDirectory, label);
  const sourceDirectory = join(packageDirectory, 'src');
  const modulePath = join(sourceDirectory, 'index.js');

  temporaryDirectories.push(testDirectory);
  await mkdir(sourceDirectory, { recursive: true });
  await Promise.all([
    writeFile(join(packageDirectory, 'package.json'), JSON.stringify({ name: packageName })),
    writeFile(modulePath, ''),
  ]);

  return {
    modulePath,
    packageDirectory: await realpath(packageDirectory),
    testDirectory,
  };
}
