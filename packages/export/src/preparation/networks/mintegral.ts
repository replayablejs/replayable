import { PLAYABLE_HTML_FILE, requirePlayableHtml } from '#shared/playable-html.js';
import type { ExportVariantContext } from '#types/context.js';
import type { ExportFile } from '#types/export-file.js';
import {
  validateMintegralArchive,
  validateMintegralFiles,
} from '#validation/networks/mintegral.js';
import { validateArchiveStylesheets } from '#validation/stylesheet-resources.js';

import { collectBuildFiles } from '../shared/collect-build-files.js';
import { createZipArchive } from '../shared/create-zip-archive.js';
import {
  inlineStylesheets,
  loadHtmlBuildDocument,
  prepareClassicScriptEntry,
  resolveHtmlBuildResources,
  serializeHtmlDocument,
} from '../shared/html-document.js';

/** Packages one existing Mintegral build as an upload-ready ZIP archive. */
export async function prepareMintegralExport(context: ExportVariantContext): Promise<Uint8Array> {
  const buildFiles = await collectBuildFiles(context.buildDirectory);
  const files = await convertMintegralBuild(context, buildFiles);
  const html = requirePlayableHtml(files, context.variant.id);

  validateMintegralFiles(new TextDecoder().decode(html.data), files);
  await validateArchiveStylesheets(files);

  const archive = await createZipArchive(files);

  validateMintegralArchive(archive);

  return archive;
}

/**
 * Converts Replayable's four ESM entries into Mintegral's local classic-script form.
 *
 * The async wrapper preserves authored top-level `await`, while Terser verifies that
 * no imports or exports remain and safely escapes text embedded in a script context.
 */
async function convertMintegralBuild(
  context: ExportVariantContext,
  files: readonly ExportFile[],
): Promise<ExportFile[]> {
  const document = loadHtmlBuildDocument(files, context.variant.id);
  const resources = resolveHtmlBuildResources(document, files, context.variant.id);

  await inlineStylesheets(document, resources.stylesheets);
  const classicEntries = [
    await prepareClassicScriptEntry(resources.entries.host),
    await prepareClassicScriptEntry(resources.entries.config),
    await prepareClassicScriptEntry(resources.entries.assets),
    await prepareClassicScriptEntry(resources.entries.application),
  ];

  const htmlData = new TextEncoder().encode(serializeHtmlDocument(document));
  const filesByPath = new Map(files.map((file) => [file.path, file]));

  // CSS now lives inside index.html, so omit the original stylesheet files.
  for (const stylesheet of resources.stylesheets) {
    filesByPath.delete(stylesheet.file.path);
  }

  // Replace the original HTML with the transformed document.
  filesByPath.set(PLAYABLE_HTML_FILE, { path: PLAYABLE_HTML_FILE, data: htmlData });

  // Replace every module entry with its classic-script equivalent.
  for (const classicEntry of classicEntries) {
    filesByPath.set(classicEntry.path, classicEntry);
  }

  // Every untouched entry remains the original resource collected from the build.
  return [...filesByPath.values()];
}
