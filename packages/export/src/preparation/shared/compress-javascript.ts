import { deflate } from 'pako';

import type { JavaScriptCompressionCandidate } from '#types/compression.js';

const MAX_DEFLATE_LEVEL = 9;
const MIN_COMPRESSION_SAVINGS_RATIO = 0.05;

/**
 * Compresses prepared JavaScript only when its embedded Base64 is meaningfully smaller.
 *
 * Deflate produces binary data, but the standalone HTML must carry that data as
 * Base64 text. Comparing the finished Base64 payload accounts for its roughly
 * one-third expansion. Requiring a five-percent final reduction avoids spending
 * runtime CPU to inflate a large module for a negligible delivery-size saving.
 * Returning `undefined` tells the caller to preserve the original module source.
 */
export function createCompressedJavaScriptPayload(source: string): string | undefined {
  if (source.length === 0) {
    return undefined;
  }

  const compressedSource = deflate(source, { level: MAX_DEFLATE_LEVEL });
  const compressedPayload = Buffer.from(compressedSource).toString('base64');
  const sourceSize = Buffer.byteLength(source);
  const payloadSize = Buffer.byteLength(compressedPayload);
  const savingsRatio = (sourceSize - payloadSize) / sourceSize;

  if (savingsRatio < MIN_COMPRESSION_SAVINGS_RATIO) {
    return undefined;
  }

  return compressedPayload;
}

/** Creates both delivery representations without discarding the prepared source. */
export function createJavaScriptCompressionCandidate(
  source: string,
): JavaScriptCompressionCandidate {
  return {
    compressedPayload: createCompressedJavaScriptPayload(source),
    source,
  };
}
