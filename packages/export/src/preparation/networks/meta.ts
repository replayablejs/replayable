import { MAX_EXPORT_SIZE_BYTES } from '#shared/export-limits.js';
import type { ExportVariantContext } from '#types/context.js';

import { prepareSingleHtmlExport } from '../shared/single-html.js';

/** Produces one self-contained HTML document accepted by Meta playable ads. */
export function prepareMetaExport(context: ExportVariantContext): Promise<string> {
  return prepareSingleHtmlExport(context, {
    maxFileSizeBytes: MAX_EXPORT_SIZE_BYTES,
    networkName: 'Meta',
  });
}
