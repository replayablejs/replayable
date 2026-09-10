import { prepareAppLovinExport } from '#preparation/networks/applovin.js';
import { prepareGoogleExport } from '#preparation/networks/google.js';
import { prepareLiftoffExport } from '#preparation/networks/liftoff.js';
import { prepareMetaExport } from '#preparation/networks/meta.js';
import { prepareMintegralExport } from '#preparation/networks/mintegral.js';
import { prepareMolocoExport } from '#preparation/networks/moloco.js';
import { preparePreviewExport } from '#preparation/networks/preview.js';
import { prepareUnityExport } from '#preparation/networks/unity.js';
import type { PreparedExportArtifact } from '#types/artifact.js';
import type { ExportProjectContext, ExportVariantContext } from '#types/context.js';

/** Prepares every network artifact in memory without changing existing exports. */
export function prepareExportProject(
  project: ExportProjectContext,
): Promise<PreparedExportArtifact[]> {
  return Promise.all(project.variants.map(prepareExportVariant));
}

/** Prepares one resolved variant and keeps its destination beside the content. */
async function prepareExportVariant(
  context: ExportVariantContext,
): Promise<PreparedExportArtifact> {
  return {
    content: await prepareExportContent(context),
    outputFile: context.outputFile,
    variantId: context.variant.id,
  };
}

/** Applies the delivery rules owned by the resolved variant's network. */
function prepareExportContent(context: ExportVariantContext): Promise<string | Uint8Array> {
  switch (context.variant.network) {
    case 'applovin':
      return prepareAppLovinExport(context);
    case 'google':
      return prepareGoogleExport(context);
    case 'liftoff':
      return prepareLiftoffExport(context);
    case 'meta':
      return prepareMetaExport(context);
    case 'mintegral':
      return prepareMintegralExport(context);
    case 'moloco':
      return prepareMolocoExport(context);
    case 'preview':
      return preparePreviewExport(context);
    case 'unity':
      return prepareUnityExport(context);
    default:
      throw new Error(`Unsupported export network: ${String(context.variant.network)}.`);
  }
}
