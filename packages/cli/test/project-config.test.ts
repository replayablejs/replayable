import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadProjectConfig } from '../src/config/load-project-config.js';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function fixture(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'replayable-project-'));
  directories.push(directory);
  const source = await readFile(
    new URL('../../config/test/fixtures/preview-config.ts', import.meta.url),
    'utf8',
  );
  await writeFile(join(directory, 'replayable.config.ts'), source + '\nexport default config;');
  return directory;
}

it('keeps project data optional and loads it beside a custom config path, not cwd', async () => {
  const directory = await fixture();
  const path = join(directory, 'replayable.config.ts');
  const original = await readFile(path, 'utf8');
  const base = await loadProjectConfig(path);
  await writeFile(
    join(directory, 'replayable.project.json'),
    JSON.stringify({
      schemaVersion: 1,
      versions: { copied: {} },
      controls: { persistentCta: false },
    }),
  );
  const merged = await loadProjectConfig(path);
  expect(merged.versions).toHaveProperty('copied');
  expect(merged.controls.persistentCta).toBe(false);
  expect(base.versions).not.toHaveProperty('copied');
  expect(await readFile(path, 'utf8')).toBe(original);
});

it.each([
  '{',
  '{"schemaVersion":2}',
  '{"schemaVersion":1,"versions":{"copy":{"params":{"unknown":1}}}}',
])('fails on invalid project data rather than silently ignoring it: %s', async (source) => {
  const directory = await fixture();
  await writeFile(join(directory, 'replayable.project.json'), source);
  await expect(loadProjectConfig(join(directory, 'replayable.config.ts'))).rejects.toThrow(
    'Invalid project data',
  );
});
