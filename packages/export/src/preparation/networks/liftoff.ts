import type { ExportVariantContext } from '#types/context.js';
import { validateLiftoffFiles } from '#validation/networks/liftoff.js';
import { validateArchiveStylesheets } from '#validation/stylesheet-resources.js';

import { collectBuildFiles } from '../shared/collect-build-files.js';
import { createZipArchive } from '../shared/create-zip-archive.js';

/** Packages one existing Liftoff build as an upload-ready progressive-loading ZIP. */
export async function prepareLiftoffExport(context: ExportVariantContext): Promise<Uint8Array> {
  const files = await collectBuildFiles(context.buildDirectory);

  validateLiftoffFiles(files, context.variant.id);
  await validateArchiveStylesheets(files);

  return createZipArchive(files);
}
