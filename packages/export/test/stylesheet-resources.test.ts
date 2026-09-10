import { load } from 'cheerio';
import { expect, it } from 'vitest';

import { validateSingleHtmlExport } from '../src/validation/single-html.js';
import { validateArchiveStylesheets } from '../src/validation/stylesheet-resources.js';

const options = { networkName: 'Preview', maxFileSizeBytes: 5_000_000 };

it.each([
  '<style>.game { background: url(https://example.com/image.png) }</style>',
  '<style>@import "https://example.com/theme.css";</style>',
  '<div style="background: url(missing.png)"></div>',
  '<style>.game { background: u\\72l("https://example.com/image.png") }</style>',
])('rejects unavailable CSS resources: %s', async (source) => {
  await expect(validateSingleHtmlExport(load(source), source, options)).rejects.toThrow(
    'unavailable resources',
  );
});

it('accepts embedded images and fragment references', async () => {
  const source =
    '<style>.game { background: url(data:image/png;base64,AA==); filter: url(#blur) }</style>';
  await expect(validateSingleHtmlExport(load(source), source, options)).resolves.toBeUndefined();
});

it('resolves archive references relative to the containing CSS file', async () => {
  await expect(
    validateArchiveStylesheets([
      {
        path: 'styles/main.css',
        data: new TextEncoder().encode(
          '@import "theme.css"; .game { background: url(../images/tile.png) }',
        ),
      },
      { path: 'styles/theme.css', data: new Uint8Array() },
      { path: 'images/tile.png', data: new Uint8Array() },
    ]),
  ).resolves.toBeUndefined();
});

it('checks imported CSS and rejects missing dependencies', async () => {
  await expect(
    validateArchiveStylesheets([
      { path: 'main.css', data: new TextEncoder().encode('@import "theme.css";') },
      {
        path: 'theme.css',
        data: new TextEncoder().encode('.game { background: url(missing.png) }'),
      },
    ]),
  ).rejects.toThrow('missing.png');
});

it('does not restore unsupported srcset validation', async () => {
  const source = '<img srcset="external.png 2x">';
  await expect(validateSingleHtmlExport(load(source), source, options)).resolves.toBeUndefined();
});

it('rejects CSS paths escaping the archive root', async () => {
  await expect(
    validateArchiveStylesheets([
      {
        path: 'styles/main.css',
        data: new TextEncoder().encode('.game { background: url(../../image.png) }'),
      },
      { path: 'image.png', data: new Uint8Array() },
    ]),
  ).rejects.toThrow('unavailable resources');
});
