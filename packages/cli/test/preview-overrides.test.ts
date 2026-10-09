import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, expect, it } from 'vitest';

import { loadPreviewOverrides } from '../src/config/load-preview-overrides.js';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

async function fixture(source: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'replayable-overrides-'));
  directories.push(directory);
  const file = join(directory, 'preview.json');
  await writeFile(file, source);
  return file;
}

it('loads selectors and partial settings from JSON data', async () => {
  const input = {
    version: 'alternate',
    language: 'hy',
    params: { speed: 2 },
    devtools: { soundControl: true },
  };
  expect(await loadPreviewOverrides(await fixture(JSON.stringify(input)))).toEqual(input);
});

it.each(['{', 'export default {}', '{"network":"meta"}', '{"params":{"speed":null}}'])(
  'rejects invalid file: %s',
  async (source) => {
    await expect(loadPreviewOverrides(await fixture(source))).rejects.toThrow(
      'Could not load preview overrides',
    );
  },
);

it('reports the file path and underlying read failure', async () => {
  const file = await fixture('{}');
  await rm(file);
  await expect(loadPreviewOverrides(file)).rejects.toMatchObject({
    message: expect.stringContaining(file),
    cause: expect.any(Error),
  });
});
