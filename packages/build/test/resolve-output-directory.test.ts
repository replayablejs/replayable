import { mkdtempSync, mkdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { resolveOutputDirectory } from '../src/pipeline/resolve-output-directory.js';

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createDirectory(): string {
  const directory = realpathSync.native(mkdtempSync(join(tmpdir(), 'replayable-output-')));
  directories.push(directory);
  return directory;
}

it('accepts a new nested output inside the project', () => {
  const project = createDirectory();
  expect(resolveOutputDirectory(project, 'dist/default/preview/en')).toBe(
    join(project, 'dist/default/preview/en'),
  );
});

it.each(['.', '..', '../outside'])('rejects unsafe lexical output %s', (output) => {
  expect(() => resolveOutputDirectory(createDirectory(), output)).toThrow('inside the project');
});

it('rejects an outside symlink ancestor even when its output does not exist', () => {
  const project = createDirectory();
  const outside = createDirectory();
  symlinkSync(outside, join(project, 'linked'), 'junction');
  expect(() => resolveOutputDirectory(project, 'linked/new/dist')).toThrow('inside the project');
});

it('rejects a symlink resolving to the project root', () => {
  const project = createDirectory();
  symlinkSync(project, join(project, 'linked'), 'junction');
  expect(() => resolveOutputDirectory(project, 'linked')).toThrow('inside the project');
});

it('supports a symlinked project root and an internal output link', () => {
  const root = createDirectory();
  const project = join(root, 'project');
  mkdirSync(join(project, 'generated'), { recursive: true });
  symlinkSync(project, join(root, 'alias'), 'junction');
  symlinkSync(join(project, 'generated'), join(project, 'linked'), 'junction');
  expect(resolveOutputDirectory(join(root, 'alias'), 'linked/dist')).toBe(
    join(root, 'alias/linked/dist'),
  );
});

it('does not treat a dangling link as a missing output directory', () => {
  const project = createDirectory();
  symlinkSync(join(project, 'missing'), join(project, 'linked'), 'junction');
  expect(() => resolveOutputDirectory(project, 'linked/dist')).toThrow(/ENOENT/);
});

it('does not swallow filesystem errors from a non-directory ancestor', () => {
  const project = createDirectory();
  writeFileSync(join(project, 'file'), 'not a directory');
  expect(() => resolveOutputDirectory(project, 'file/dist')).toThrow(/ENOTDIR/);
});
