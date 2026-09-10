import type { ExportVariantContext } from '#types/context.js';
import type { SingleHtmlExportOptions } from '#types/single-html.js';
import { validateSingleHtmlExport } from '#validation/single-html.js';

import { collectBuildFiles } from './collect-build-files.js';
import { createJavaScriptCompressionCandidate } from './compress-javascript.js';
import {
  inlinePreparedModuleEntry,
  inlineStylesheets,
  loadHtmlBuildDocument,
  prepareModuleEntrySource,
  resolveHtmlBuildResources,
  serializeHtmlDocument,
} from './html-document.js';
import { inlineCompressedModules } from './inline-compressed-modules.js';
import { inlinePakoInflater } from './inline-pako-inflater.js';

/**
 * Produces one standalone HTML document from an existing runnable build.
 *
 * Local stylesheets and the validator-visible host and config entries are embedded
 * directly. Assets and application become ordered payloads when compression is
 * useful: qualifying Deflate results use Base64, while the other entry remains plain
 * source. If neither qualifies, both remain ordinary inline modules. The final
 * document is validated against the network's size and external-resource policy.
 */
export async function prepareSingleHtmlExport(
  context: ExportVariantContext,
  options: SingleHtmlExportOptions,
): Promise<string> {
  const files = await collectBuildFiles(context.buildDirectory);
  const document = loadHtmlBuildDocument(files, context.variant.id);
  const resources = resolveHtmlBuildResources(document, files, context.variant.id);

  await inlineStylesheets(document, resources.stylesheets);
  const [host, config, assets, application] = await Promise.all([
    prepareModuleEntrySource(resources.entries.host),
    prepareModuleEntrySource(resources.entries.config),
    prepareModuleEntrySource(resources.entries.assets),
    prepareModuleEntrySource(resources.entries.application),
  ]);

  // Inspect the exact prepared code before Base64 can hide prohibited APIs.
  options.validateJavaScript?.([host, config, assets, application]);
  inlinePreparedModuleEntry(resources.entries.host, host);
  inlinePreparedModuleEntry(resources.entries.config, config);

  // Only generated assets and authored application code are compression candidates.
  // Host calls and resolved configuration stay visible to static network validators.
  const assetsModule = createJavaScriptCompressionCandidate(assets);
  const applicationModule = createJavaScriptCompressionCandidate(application);

  const usesCompression =
    assetsModule.compressedPayload !== undefined ||
    applicationModule.compressedPayload !== undefined;

  if (usesCompression) {
    await inlinePakoInflater(resources.entries.assets);
    await inlineCompressedModules({
      application: {
        candidate: applicationModule,
        resource: resources.entries.application,
      },
      assets: {
        candidate: assetsModule,
        resource: resources.entries.assets,
      },
    });
  } else {
    inlinePreparedModuleEntry(resources.entries.assets, assetsModule.source);
    inlinePreparedModuleEntry(resources.entries.application, applicationModule.source);
  }

  const source = serializeHtmlDocument(document);

  await validateSingleHtmlExport(document, source, options);

  return source;
}
