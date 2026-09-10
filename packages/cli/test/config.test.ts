import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { replayableConfigSchema } from '@replayablejs/config';
import open from 'open';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { loadDefaultExport } from '../src/config/load-default-export.js';
import { renderConfigViewer } from '../src/config/render-config-viewer.js';
import { createProgram } from '../src/program.js';

vi.mock('open', () => ({ default: vi.fn<typeof open>() }));

const temporaryDirectories: string[] = [];
const testDirectory = dirname(fileURLToPath(import.meta.url));

beforeEach(() => {
  vi.mocked(open).mockClear();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('replayable config', () => {
  it('keeps different projects separate and reuses the same resolved config identity', async () => {
    const first = await createConfigFixture();
    const second = await createConfigFixture();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const cwd = vi.spyOn(process, 'cwd');

    cwd.mockReturnValue(dirname(first));
    await createProgram().parseAsync(['node', 'replayable', 'config']);
    const firstViewer = vi.mocked(open).mock.lastCall?.[0];
    await createProgram().parseAsync(['node', 'replayable', 'config', '--config', first]);
    expect(vi.mocked(open).mock.lastCall?.[0]).toBe(firstViewer);

    cwd.mockReturnValue(dirname(second));
    await createProgram().parseAsync(['node', 'replayable', 'config']);
    expect(vi.mocked(open).mock.lastCall?.[0]).not.toBe(firstViewer);
  });

  it('renders authored names as text and includes the separate stylesheet', async () => {
    const fixture = await createConfigFixture();
    const config = replayableConfigSchema.parse(await loadDefaultExport(fixture));
    const html = renderConfigViewer({ ...config, name: '<img src=x onerror=alert(1)>' }, []);
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&#x3C;img');
    expect(html).toMatch(/color-scheme:\s*dark/);
    expect(html).toContain('dumper');
  });
  it('opens an interactive playable-variant viewer by default', async () => {
    const config = await createConfigFixture();
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await createProgram().parseAsync(['node', 'replayable', 'config', '--config', config]);

    expect(open).toHaveBeenCalledOnce();
    const viewerPath = String(vi.mocked(open).mock.calls[0]?.[0]);
    const viewer = await readFile(viewerPath, 'utf8');

    expect(viewer).toContain('<title>Replayable Variants</title>');
    expect(viewer).toContain('<dt>Project</dt><dd>basic-playable</dd>');
    expect(viewer).toContain('<dt>Entry</dt><dd>src/main.ts</dd>');
    expect(viewer).toContain('<dt>Variants</dt><dd>2</dd>');
    expect(viewer).toContain('dumper-toggle');
    expect(viewer).toContain('default/preview/hy');
    expect(output).toHaveBeenCalledWith('Opened the playable variants in your browser.');
  });

  it('prints the playable variants directly with --json', async () => {
    const config = await createConfigFixture();
    const output = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await createProgram().parseAsync([
      'node',
      'replayable',
      'config',
      '--config',
      config,
      '--json',
    ]);

    const variants = JSON.parse(String(output.mock.calls[0]?.[0]));

    expect(variants).toMatchObject([
      { id: 'default/preview/en', localization: { fallback: 'en', language: 'en' } },
      { id: 'default/preview/hy', localization: { fallback: 'en', language: 'hy' } },
    ]);
  });
});

async function createConfigFixture(): Promise<string> {
  const directory = await mkdtemp(resolve(testDirectory, '.config-'));
  const config = resolve(directory, 'replayable.config.ts');
  temporaryDirectories.push(directory);
  await writeFile(
    config,
    `import { defineConfig } from '@replayablejs/config';

      export default defineConfig({
        assets: {
          sourceDir: 'assets',
          outDir: 'src/assets/resources',
          assets: {},
          emit: { assets: 'src/assets/assets.ts' }
        },
        localization: { fallback: 'en', languages: ['en', 'hy'] },
        name: 'basic-playable',
        screen: {
          orientations: {
            portrait: {
              enabled: true,
              width: 700,
              height: 1400,
              ratio: { min: 0.46, max: 0.76 }
            },
            landscape: {
              enabled: true,
              width: 1400,
              height: 700,
              ratio: { min: 0.46, max: 0.76 }
            }
          },
          resolution: {
            pixelRatio: { min: 1, max: 2 },
            renderScale: { minimal: 0.55, reduced: 0.65, balanced: 0.85, full: 1 }
          }
        },
        store: {
          androidUrl: 'https://play.google.com/store/apps/details?id=com.example.game',
          iosUrl: 'https://apps.apple.com/app/id123456789'
        }
      });`,
  );

  return config;
}
