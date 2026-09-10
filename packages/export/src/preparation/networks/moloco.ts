import { MAX_EXPORT_SIZE_BYTES } from '#shared/export-limits.js';
import type { ExportVariantContext } from '#types/context.js';
import {
  validateMolocoJavaScript,
  validateMolocoSource,
  validateMolocoVariant,
} from '#validation/networks/moloco.js';

import { prepareSingleHtmlExport } from '../shared/single-html.js';

/** Produces one self-contained HTML document accepted by Moloco playable ads. */
export async function prepareMolocoExport(context: ExportVariantContext): Promise<string> {
  validateMolocoVariant(context);

  const source = await prepareSingleHtmlExport(context, {
    maxFileSizeBytes: MAX_EXPORT_SIZE_BYTES,
    networkName: 'Moloco',
    validateJavaScript: validateMolocoJavaScript,
  });

  validateMolocoSource(source);

  return source;
}
