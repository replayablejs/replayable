import { inflate } from 'pako';
import { expect, it } from 'vitest';

import { createJavaScriptCompressionCandidate } from '../src/preparation/shared/compress-javascript.js';
import { validateMolocoJavaScript } from '../src/validation/networks/moloco.js';

it('keeps a small rejected entry as identity source', () => {
  expect(createJavaScriptCompressionCandidate('void 0;')).toEqual({
    source: 'void 0;',
    compressedPayload: undefined,
  });
});

it('requires at least five percent saving after Base64 and roundtrips UTF-8', () => {
  const source = 'console.log("Հայերեն");'.repeat(200);
  const { compressedPayload } = createJavaScriptCompressionCandidate(source);
  expect(compressedPayload).toBeDefined();
  const payload = compressedPayload ?? '';
  expect(Buffer.byteLength(payload)).toBeLessThanOrEqual(Buffer.byteLength(source) * 0.95);
  expect(inflate(Buffer.from(payload, 'base64'), { to: 'string' })).toBe(source);
});

it.each(['window.open("https://example.com")', 'new XMLHttpRequest()', 'import("mraid.js")'])(
  'rejects prohibited Moloco code before compression: %s',
  (call) => {
    const source = `FbPlayableAd.onCTAClick();${call};` + 'console.log("test");'.repeat(300);
    expect(createJavaScriptCompressionCandidate(source).compressedPayload).toBeDefined();
    expect(() => validateMolocoJavaScript([source])).toThrow(/Moloco export/u);
  },
);

it('does not apply the final document size limit to uncompressed code', () => {
  expect(() =>
    validateMolocoJavaScript(['FbPlayableAd.onCTAClick();' + ' '.repeat(5_000_000)]),
  ).not.toThrow();
});
