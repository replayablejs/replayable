import { MAX_EXPORT_SIZE_BYTES } from '#shared/export-limits.js';
import type { ExportVariantContext } from '#types/context.js';

import { prepareSingleHtmlExport } from '../shared/single-html.js';

/** Produces one upload-ready AppLovin document from an existing variant build. */
export function prepareAppLovinExport(context: ExportVariantContext): Promise<string> {
  return prepareSingleHtmlExport(context, {
    maxFileSizeBytes: MAX_EXPORT_SIZE_BYTES,
    networkName: 'AppLovin',
  });
}
