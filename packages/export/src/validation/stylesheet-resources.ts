import { load, type CheerioAPI } from 'cheerio';
import { build } from 'esbuild';

import { resolveExportFileReference } from '#shared/export-file-reference.js';
import { PLAYABLE_HTML_FILE } from '#shared/playable-html.js';
import type { ExportFile } from '#types/export-file.js';

import { isEmbeddedResourceReference } from './resource-references.js';

/** Checks inline CSS in its final HTML location, including style attributes. */
export async function validateDocumentStylesheets(
  document: CheerioAPI,
  files: readonly ExportFile[] = [],
  htmlPath = PLAYABLE_HTML_FILE,
): Promise<void> {
  for (const element of document('style, [style]').toArray()) {
    const node = document(element);
    if (element.tagName === 'style') {
      await validateStylesheetResources(node.text(), htmlPath, files);
    }
    const declarations = node.attr('style');
    if (declarations !== undefined) {
      await validateStylesheetResources(`.inline { ${declarations} }`, htmlPath, files);
    }
  }
}

/** Checks each archived stylesheet relative to its own file, not the root HTML. */
export async function validateArchiveStylesheets(files: readonly ExportFile[]): Promise<void> {
  const decoder = new TextDecoder();
  for (const file of files) {
    if (file.path.endsWith('.css')) {
      await validateStylesheetResources(decoder.decode(file.data), file.path, files);
    } else if (file.path.endsWith('.html')) {
      await validateDocumentStylesheets(load(decoder.decode(file.data)), files, file.path);
    }
  }
}

/**
 * Lets esbuild parse CSS escapes, url() and @import rather than guessing with regex.
 * All references are marked external during this inspection: nothing is fetched,
 * emitted, or bundled. The existing export files are the only allowed resources.
 */
async function validateStylesheetResources(
  source: string,
  owner: string,
  files: readonly ExportFile[],
): Promise<void> {
  const paths = new Set(files.map((file) => file.path));
  const unavailable = new Set<string>();
  await build({
    stdin: { contents: source, loader: 'css', sourcefile: owner },
    bundle: true,
    write: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'validate-export-css-resources',
        setup(builder) {
          // esbuild uses Go regular expressions, which do not accept the JS u flag.
          builder.onResolve({ filter: /.*/ }, ({ path }) => {
            if (
              !isEmbeddedResourceReference(path) &&
              !isArchivedStylesheetResource(path, owner, paths)
            ) {
              unavailable.add(path);
            }
            return { path, external: true };
          });
        },
      },
    ],
  });
  if (unavailable.size > 0) {
    throw new Error(
      `Stylesheet in ${owner} contains unavailable resources: ${[...unavailable].join(', ')}.`,
    );
  }
}

/** Resolves nested CSS URLs while rejecting remote and root-relative resources. */
function isArchivedStylesheetResource(
  reference: string,
  owner: string,
  paths: ReadonlySet<string>,
): boolean {
  if (reference.startsWith('/') || /^[a-z][a-z\d+.-]*:/iu.test(reference)) {
    return false;
  }
  const path = resolveExportFileReference(posix.join(posix.dirname(owner), reference));
  return path !== undefined && paths.has(path);
}
import { posix } from 'node:path';
