import { buildAssets } from '@replayablejs/assets';
import { buildProject, servePreview } from '@replayablejs/build';
import { exportProject } from '@replayablejs/export';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { loadDefaultExport } from '../src/config/load-default-export.js';
import { createProgram } from '../src/program.js';
import { config } from './fixtures/config.js';

vi.mock(import('@replayablejs/assets'), async (importOriginal) => ({
  ...(await importOriginal()),
  buildAssets: vi.fn<typeof buildAssets>(),
}));
vi.mock('@replayablejs/build', () => ({
  buildProject: vi.fn<typeof buildProject>(),
  servePreview: vi.fn<typeof servePreview>(),
}));
vi.mock('@replayablejs/export', () => ({ exportProject: vi.fn<typeof exportProject>() }));
vi.mock('../src/config/load-default-export.js', () => ({
  loadDefaultExport: vi.fn<typeof loadDefaultExport>(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(loadDefaultExport).mockResolvedValue(config);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('delegates a project build without selecting or iterating variants itself', async () => {
  vi.mocked(buildProject).mockResolvedValue({ outputDirectory: '/project/dist', variants: [] });
  await createProgram().parseAsync(['node', 'replayable', 'build', '--config', 'custom.ts']);
  expect(loadDefaultExport).toHaveBeenCalledExactlyOnceWith('custom.ts');
  expect(buildProject).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ name: 'cli-test' }),
  );
});

it('delegates exports with the explicit output directory', async () => {
  vi.mocked(exportProject).mockResolvedValue({ outputDirectory: '/project/export', variants: [] });
  await createProgram().parseAsync(['node', 'replayable', 'export', '--output', 'delivery']);
  expect(exportProject).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ name: 'cli-test' }),
    {
      outputDirectory: 'delivery',
      projectRoot: process.cwd(),
    },
  );
});

it('passes parsed development options and reports both URL groups', async () => {
  vi.mocked(servePreview).mockResolvedValue({
    close: vi.fn<() => Promise<void>>(),
    variantId: 'alternate/preview/hy',
    localUrls: ['http://localhost:5180/'],
    networkUrls: ['http://192.168.1.2:5180/'],
  });
  await createProgram().parseAsync([
    'node',
    'replayable',
    'dev',
    '--port',
    '5180',
    '--host',
    '0.0.0.0',
    '--open',
    '--language',
    'hy',
    '--version',
    'alternate',
  ]);
  expect(servePreview).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ name: 'cli-test' }),
    {
      port: 5180,
      host: '0.0.0.0',
      open: true,
      language: 'hy',
      version: 'alternate',
      projectRoot: process.cwd(),
    },
  );
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('http://localhost:5180/'));
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining('http://192.168.1.2:5180/'));
});

it.each(['0', '-1', '65536', '1.5', 'abc'])(
  'rejects invalid port %s before loading config',
  async (port) => {
    const program = createProgram();
    for (const command of [program, ...program.commands]) {
      command.exitOverride().configureOutput({ writeErr: () => undefined });
    }
    await expect(program.parseAsync(['node', 'replayable', 'dev', '--port', port])).rejects.toThrow(
      'Port must be an integer',
    );
    expect(loadDefaultExport).not.toHaveBeenCalled();
    expect(servePreview).not.toHaveBeenCalled();
  },
);

it('delegates standalone asset builds', async () => {
  vi.mocked(loadDefaultExport).mockResolvedValue({
    ...config.assets,
    localization: { language: 'en', fallback: 'en' },
  });
  // A failed processor must propagate to the common CLI error reporter.
  const failure = new Error('asset processing failed');
  vi.mocked(buildAssets).mockRejectedValue(failure);
  await expect(createProgram().parseAsync(['node', 'replayable', 'assets'])).rejects.toBe(failure);
  expect(loadDefaultExport).toHaveBeenCalledExactlyOnceWith('replayable.assets.ts');
  expect(buildAssets).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ sourceDir: 'assets' }),
  );
});

it('rejects invalid configuration before calling the builder', async () => {
  vi.mocked(loadDefaultExport).mockResolvedValue({ name: 'incomplete' });
  await expect(createProgram().parseAsync(['node', 'replayable', 'build'])).rejects.toThrow(
    'Invalid input',
  );
  expect(buildProject).not.toHaveBeenCalled();
});
