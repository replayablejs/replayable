import { load } from 'cheerio';
import { describe, expect, it } from 'vitest';

import type { ExportFile } from '../src/types/export-file.js';
import { validateGoogleArchive, validateGoogleFiles } from '../src/validation/networks/google.js';
import { validateLiftoffFiles } from '../src/validation/networks/liftoff.js';
import { validateMintegralArchive } from '../src/validation/networks/mintegral.js';
import { validateMolocoSource } from '../src/validation/networks/moloco.js';
import { validateSingleHtmlExport } from '../src/validation/single-html.js';

const limit = 5_000_000;
const entries = ['host', 'config', 'assets', 'application']
  .map((role) => `<script data-replayable-entry="${role}" src="main.js"></script>`)
  .join('');
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="ad.orientation" content="portrait,landscape"><script src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"></script></head><body>${entries}</body></html>`;
const liftoffHtml = `<!DOCTYPE html><html><head></head><body>${entries}</body></html>`;

function file(path: string, source: string): ExportFile {
  return { path, data: new TextEncoder().encode(source) };
}

function padToBytes(source: string, bytes: number): string {
  return source + ' '.repeat(bytes - Buffer.byteLength(source));
}

describe.each([
  ['Google', validateGoogleArchive],
  ['Mintegral', validateMintegralArchive],
] as const)('%s archive size', (_network, validate) => {
  it.each([limit - 1, limit])('accepts %i bytes', (bytes) => {
    expect(() => validate(new Uint8Array(bytes))).not.toThrow();
  });

  it('rejects one byte over the limit', () => {
    expect(() => validate(new Uint8Array(limit + 1))).toThrow(/5 MB limit.*5,000,001/);
  });
});

it.each([511, 512])('accepts a valid Google archive with %i files', (count) => {
  const files = [file('index.html', html), file('main.js', 'ExitApi.exit();')];
  files.push(
    ...Array.from({ length: count - files.length }, (_, index) => file(`asset-${index}.txt`, '')),
  );
  expect(() => validateGoogleFiles(files, 'google')).not.toThrow();
});

it('rejects a Google archive with 513 files', () => {
  const files = [file('index.html', html), file('main.js', 'ExitApi.exit();')];
  files.push(...Array.from({ length: 511 }, (_, index) => file(`asset-${index}.txt`, '')));
  expect(() => validateGoogleFiles(files, 'google')).toThrow(
    'Google archive contains 513 files; the maximum is 512.',
  );
});

it.each([limit - 1, limit])('accepts Liftoff entry HTML of %i bytes', (bytes) => {
  const files = [file('index.html', padToBytes(liftoffHtml, bytes)), file('main.js', '')];
  expect(() => validateLiftoffFiles(files, 'liftoff')).not.toThrow();
});

it('rejects Liftoff entry HTML one byte over the limit', () => {
  const files = [file('index.html', padToBytes(liftoffHtml, limit + 1)), file('main.js', '')];
  expect(() => validateLiftoffFiles(files, 'liftoff')).toThrow(
    'Liftoff HTML exceeds its 5 MB limit: 5,000,001 bytes.',
  );
});

it('does not apply the Liftoff HTML limit to aggregate resource bytes', () => {
  const files = [file('index.html', liftoffHtml), file('main.js', ' '.repeat(limit + 1))];
  expect(() => validateLiftoffFiles(files, 'liftoff')).not.toThrow();
});

it('accepts Moloco HTML one byte below its strict limit', () => {
  const source = padToBytes('<script>FbPlayableAd.onCTAClick();</script>é', limit - 1);
  expect(() => validateMolocoSource(source)).not.toThrow();
});

it.each([limit, limit + 1])('rejects Moloco HTML of %i UTF-8 bytes', (bytes) => {
  const source = padToBytes('<script>FbPlayableAd.onCTAClick();</script>é', bytes);
  expect(() => validateMolocoSource(source)).toThrow('Moloco export must be smaller than 5 MB.');
});

// Parsing a full delivery-size document is slower on shared CI runners.
it.each([limit - 1, limit])(
  'accepts single HTML of %i UTF-8 bytes',
  { timeout: 30_000 },
  async (bytes) => {
    const source = padToBytes('<!DOCTYPE html><html><body>é</body></html>', bytes);
    await expect(
      validateSingleHtmlExport(load(source), source, {
        networkName: 'Preview',
        maxFileSizeBytes: limit,
      }),
    ).resolves.toBeUndefined();
  },
);

it('rejects single HTML whose UTF-8 bytes exceed the limit despite fitting by character count', async () => {
  const source = padToBytes('<!DOCTYPE html><html><body>é</body></html>', limit + 1);
  expect(source.length).toBe(limit);
  await expect(
    validateSingleHtmlExport(load(source), source, {
      networkName: 'Preview',
      maxFileSizeBytes: limit,
    }),
  ).rejects.toThrow('Preview export exceeds its 5,000,000-byte limit: 5,000,001 bytes.');
});
