import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createVariants, defineConfig } from '@replayablejs/config';
import { load } from 'cheerio';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { prepareMolocoExport } from '../src/preparation/networks/moloco.js';
import { prepareSingleHtmlExport } from '../src/preparation/shared/single-html.js';
import type { ExportVariantContext } from '../src/types/context.js';

// Browser execution is covered separately; this fixture tests packaging boundaries.
vi.mock('../src/preparation/shared/load-compressed-module-loader.js', () => ({
  loadCompressedModuleLoader: async (): Promise<string> => 'void 0;',
}));

let context: ExportVariantContext;
beforeEach(async () => {
  const buildDirectory = await mkdtemp(join(tmpdir(), 'replayable-single-html-test-'));
  const [variant] = createVariants(
    defineConfig({
      name: 'export-test',
      assets: {
        sourceDir: 'assets',
        outDir: 'generated',
        assets: {},
        emit: { assets: 'assets.ts' },
      },
      localization: { fallback: 'en', languages: ['en'] },
      networks: { moloco: {} },
      screen: {
        orientations: {
          portrait: { enabled: true, width: 400, height: 800, ratio: { min: 0.4, max: 0.8 } },
          landscape: { enabled: true, width: 800, height: 400, ratio: { min: 1.2, max: 2.4 } },
        },
        resolution: {
          pixelRatio: { min: 1, max: 2 },
          renderScale: { minimal: 0.55, reduced: 0.65, balanced: 0.85, full: 1 },
        },
      },
      store: {
        androidUrl: 'https://play.google.com/store/apps/details?id=test',
        iosUrl: 'https://apps.apple.com/app/id123456',
      },
    }),
  );
  if (variant === undefined) {
    throw new Error('Missing test variant');
  }
  context = { buildDirectory, variant, outputFile: join(buildDirectory, 'output.html') };
  const roles = ['host', 'config', 'assets', 'application'];
  await writeFile(
    join(buildDirectory, 'index.html'),
    '<!doctype html><html><head></head><body>' +
      roles
        .map(
          (role) =>
            `<script type="module" data-replayable-entry="${role}" src="./${role}.js"></script>`,
        )
        .join('') +
      '</body></html>',
  );
  for (const role of roles) {
    await writeFile(
      join(buildDirectory, `${role}.js`),
      role === 'host' ? 'FbPlayableAd.onCTAClick();' : 'void 0;',
    );
  }
});

afterEach(async () => {
  await rm(context.buildDirectory, { recursive: true, force: true });
});

it('checks Moloco application code before hiding it in a compressed payload', async () => {
  await writeFile(
    join(context.buildDirectory, 'application.js'),
    'window.open("https://example.com");' + 'console.log("test");'.repeat(400),
  );
  await expect(prepareMolocoExport(context)).rejects.toThrow('direct JavaScript redirect');
});

it('keeps host and config visible while compressing only qualifying entries', async () => {
  await writeFile(
    join(context.buildDirectory, 'application.js'),
    'console.log("test");'.repeat(400),
  );
  const source = await prepareMolocoExport(context);
  const document = load(source);
  expect(source).toContain('FbPlayableAd.onCTAClick()');
  expect(document('[data-replayable-entry]').length).toBe(0);
  expect(
    document('[data-replayable-compressed-entry="assets"]').attr('data-replayable-entry-encoding'),
  ).toBe('identity');
  expect(
    document('[data-replayable-compressed-entry="application"]').attr(
      'data-replayable-entry-encoding',
    ),
  ).toBe('deflate');
});

it('rejects external CSS even when every JavaScript entry is self-contained', async () => {
  await writeFile(
    join(context.buildDirectory, 'index.html'),
    '<!doctype html><style>@import "https://example.com/theme.css";</style>' +
      ['host', 'config', 'assets', 'application']
        .map(
          (role) =>
            `<script type="module" data-replayable-entry="${role}" src="${role}.js"></script>`,
        )
        .join(''),
  );
  await expect(
    prepareSingleHtmlExport(context, { networkName: 'Preview', maxFileSizeBytes: 5_000_000 }),
  ).rejects.toThrow('unavailable resources');
});
