import { isWithinExportSizeLimit } from '#shared/export-limits.js';
import type { ExportVariantContext } from '#types/context.js';

import { containsBrowserRedirect } from '../browser-redirects.js';

const CTA_CALL = 'FbPlayableAd.onCTAClick()';

/** Requires the responsive portrait-and-landscape layout documented by Moloco. */
export function validateMolocoVariant(context: ExportVariantContext): void {
  const { landscape, portrait } = context.variant.screen.orientations;

  if (!landscape.enabled || !portrait.enabled) {
    throw new Error('Moloco playables must support both portrait and landscape orientations.');
  }
}

/** Rejects APIs and redirect behavior explicitly prohibited by Moloco. */
export function validateMolocoSource(source: string): void {
  if (!isWithinExportSizeLimit(Buffer.byteLength(source), 'moloco')) {
    throw new Error('Moloco export must be smaller than 5 MB.');
  }

  if (source.toLowerCase().includes('mraid.js')) {
    throw new Error('Moloco export must not contain mraid.js.');
  }
  if (!source.includes(CTA_CALL)) {
    throw new Error(`Moloco export must invoke ${CTA_CALL}.`);
  }
}

/** Checks readable code independently of the final compressed document size. */
export function validateMolocoJavaScript(sources: readonly string[]): void {
  const source = sources.join('\n');
  if (source.includes('XMLHttpRequest')) {
    throw new Error(
      'Moloco export contains XMLHttpRequest. Disable audio or remove the dependency that provides it.',
    );
  }

  if (source.toLowerCase().includes('mraid.js')) {
    throw new Error('Moloco export must not contain mraid.js.');
  }

  if (!source.includes(CTA_CALL)) {
    throw new Error(`Moloco export must invoke ${CTA_CALL}.`);
  }

  if (sources.some(containsBrowserRedirect)) {
    throw new Error('Moloco export contains a direct JavaScript redirect.');
  }
}
