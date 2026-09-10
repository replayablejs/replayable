import type { CheerioAPI } from 'cheerio';

import type { SingleHtmlExportOptions } from '#types/single-html.js';

import {
  collectUnavailableResourceReferences,
  isEmbeddedResourceReference,
} from './resource-references.js';
import { validateDocumentStylesheets } from './stylesheet-resources.js';

/** Enforces the destination policy that can be proven from one standalone document. */
export async function validateSingleHtmlExport(
  document: CheerioAPI,
  source: string,
  options: SingleHtmlExportOptions,
): Promise<void> {
  validateFileSize(source, options);
  await validateDocumentStylesheets(document);

  const preservedReferences = new Set(options.preservedResourceReferences);
  const unavailableResources = collectUnavailableResourceReferences(
    document,
    (reference) => isEmbeddedResourceReference(reference) || preservedReferences.has(reference),
  );

  if (unavailableResources.length > 0) {
    throw new Error(
      `${options.networkName} export contains non-embedded resources: ${unavailableResources.join(', ')}.`,
    );
  }
}

/** Rejects a serialized document larger than the destination network permits. */
function validateFileSize(source: string, options: SingleHtmlExportOptions): void {
  const size = Buffer.byteLength(source);

  if (size <= options.maxFileSizeBytes) {
    return;
  }

  const formattedSize = size.toLocaleString('en-US');
  const formattedLimit = options.maxFileSizeBytes.toLocaleString('en-US');

  throw new Error(
    `${options.networkName} export exceeds its ${formattedLimit}-byte limit: ${formattedSize} bytes.`,
  );
}
