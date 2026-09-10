import { MAX_EXPORT_SIZE_BYTES } from '#shared/export-limits.js';
import type { ExportVariantContext } from '#types/context.js';

import { prepareSingleHtmlExport } from '../shared/single-html.js';

/** Produces a portable self-contained document for local review and sharing. */
export function preparePreviewExport(context: ExportVariantContext): Promise<string> {
  return prepareSingleHtmlExport(context, {
    maxFileSizeBytes: MAX_EXPORT_SIZE_BYTES,
    networkName: 'Preview',
  });
}
