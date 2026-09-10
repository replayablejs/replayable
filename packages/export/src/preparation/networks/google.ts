import type { ExportVariantContext } from '#types/context.js';
import { validateGoogleArchive, validateGoogleFiles } from '#validation/networks/google.js';
import { validateArchiveStylesheets } from '#validation/stylesheet-resources.js';

import { collectBuildFiles } from '../shared/collect-build-files.js';
import { createZipArchive } from '../shared/create-zip-archive.js';

/** Packages one existing Google build as an upload-ready HTML5 ZIP. */
export async function prepareGoogleExport(context: ExportVariantContext): Promise<Uint8Array> {
  const files = await collectBuildFiles(context.buildDirectory);

  validateGoogleFiles(files, context.variant.id);
  await validateArchiveStylesheets(files);

  const archive = await createZipArchive(files);

  validateGoogleArchive(archive);

  return archive;
}
