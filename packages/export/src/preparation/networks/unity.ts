import { MAX_EXPORT_SIZE_BYTES } from '#shared/export-limits.js';
import type { ExportVariantContext } from '#types/context.js';

import { prepareSingleHtmlExport } from '../shared/single-html.js';

const UNITY_MRAID_REFERENCE = 'mraid.js';

/** Produces one upload-ready Unity document while preserving its host-injected MRAID bootstrap. */
export function prepareUnityExport(context: ExportVariantContext): Promise<string> {
  return prepareSingleHtmlExport(context, {
    maxFileSizeBytes: MAX_EXPORT_SIZE_BYTES,
    networkName: 'Unity',
    preservedResourceReferences: [UNITY_MRAID_REFERENCE],
  });
}
