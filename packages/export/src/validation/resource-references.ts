import type { CheerioAPI } from 'cheerio';

import { resolveExportFileReference } from '#shared/export-file-reference.js';

const RESOURCE_SELECTOR = '[src], link[href], object[data], video[poster]';
const RESOURCE_ATTRIBUTES = ['src', 'href', 'data', 'poster'] as const;

/**
 * Describes every document resource rejected by the caller's availability policy.
 *
 * For example, an unresolved image becomes 'img[src]="assets/logo.png"', making
 * the exact element, attribute, and reference immediately visible in diagnostics.
 */
export function collectUnavailableResourceReferences(
  document: CheerioAPI,
  isAvailable: (reference: string) => boolean,
): string[] {
  const unavailableResources: string[] = [];

  for (const element of document(RESOURCE_SELECTOR).toArray()) {
    for (const attribute of RESOURCE_ATTRIBUTES) {
      const reference = document(element).attr(attribute);

      if (reference === undefined || isAvailable(reference)) {
        continue;
      }

      unavailableResources.push(`${element.tagName}[${attribute}]=${JSON.stringify(reference)}`);
    }
  }

  return unavailableResources;
}

/** Reports whether a reference's bytes already live inside the HTML document. */
export function isEmbeddedResourceReference(reference: string): boolean {
  return reference.startsWith('data:') || reference.startsWith('#');
}

/**
 * Reports whether a resource is embedded or resolves to a file inside an archive.
 *
 * The caller builds the path set once, then reuses it for every document
 * reference instead of repeatedly searching the archive file array.
 */
export function isAvailableArchiveResourceReference(
  reference: string,
  archivePaths: ReadonlySet<string>,
): boolean {
  if (isEmbeddedResourceReference(reference)) {
    return true;
  }

  const exportFilePath = resolveExportFileReference(reference);

  return exportFilePath !== undefined && archivePaths.has(exportFilePath);
}
