import { expect, it } from 'vitest';

import { containsBrowserRedirect } from '../src/validation/browser-redirects.js';
import { validateMolocoJavaScript } from '../src/validation/networks/moloco.js';

it.each([
  'window.open("https://example.com");',
  'location = "https://example.com";',
  'window.location.href = "https://example.com";',
  'self["location"]["replace"]("https://example.com");',
  'globalThis.location.assign("https://example.com");',
  'window?.open?.("https://example.com");',
])('recognizes browser navigation: %s', (source) => {
  expect(containsBrowserRedirect(source)).toBe(true);
});

it.each([
  'attributes[name].location = gl.getAttribLocation(program, name);',
  'renderer.location = 0;',
  'document.open();',
  'const help = "window.open() and location.href =";',
  '// window.open("example");\nvoid 0;',
])('ignores unrelated properties and non-executable text: %s', (source) => {
  expect(containsBrowserRedirect(source)).toBe(false);
});

it('parses independent modules without creating duplicate declaration errors', () => {
  expect(() =>
    validateMolocoJavaScript([
      'const a = 1; FbPlayableAd.onCTAClick();',
      'const a = 2; console.log(a);',
    ]),
  ).not.toThrow();
});
