import {
  COMPRESSED_ENTRY_ATTRIBUTE,
  ENTRY_ENCODING_ATTRIBUTE,
} from '#shared/compression-protocol.js';
import type { CompressibleEntries, CompressibleEntry } from '#types/compression.js';

import { loadCompressedModuleLoader } from './load-compressed-module-loader.js';

/**
 * Stores assets and application as inert payloads and appends their shared loader.
 *
 * Compressed entries use Base64 because Deflate produces binary data. An entry
 * that did not become smaller remains readable JavaScript under `identity`
 * encoding, avoiding Base64's one-third expansion while preserving deterministic
 * assets-before-application execution.
 */
export async function inlineCompressedModules(entries: CompressibleEntries): Promise<void> {
  const loaderSource = await loadCompressedModuleLoader();
  const loader = entries.application.resource.element.clone();

  storeModulePayload(entries.assets, 'assets');
  storeModulePayload(entries.application, 'application');

  loader.removeAttr('src');
  loader.removeAttr(COMPRESSED_ENTRY_ATTRIBUTE);
  loader.removeAttr(ENTRY_ENCODING_ATTRIBUTE);
  loader.attr('type', 'module');
  loader.text(loaderSource);

  entries.application.resource.element.after(loader);
}

/** Replaces one module reference with its selected inert delivery representation. */
function storeModulePayload(entry: CompressibleEntry, role: 'application' | 'assets'): void {
  const compressedPayload = entry.candidate.compressedPayload;

  entry.resource.element.removeAttr('src');
  entry.resource.element.attr('type', 'application/octet-stream');
  entry.resource.element.attr(COMPRESSED_ENTRY_ATTRIBUTE, role);
  entry.resource.element.attr(
    ENTRY_ENCODING_ATTRIBUTE,
    compressedPayload === undefined ? 'identity' : 'deflate',
  );
  entry.resource.element.text(compressedPayload ?? entry.candidate.source);
}
