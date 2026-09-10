import { load } from 'cheerio';

import { isWithinExportSizeLimit } from '#shared/export-limits.js';
import type { ExportFile } from '#types/export-file.js';

import {
  collectUnavailableResourceReferences,
  isAvailableArchiveResourceReference,
} from '../resource-references.js';

/** Ensures every resource requested by the prepared HTML is contained in the ZIP. */
export function validateMintegralFiles(source: string, files: readonly ExportFile[]): void {
  const document = load(source);
  const archivePaths = new Set(files.map(({ path }) => path));
  const unavailableResources = collectUnavailableResourceReferences(document, (reference) =>
    isAvailableArchiveResourceReference(reference, archivePaths),
  );

  if (unavailableResources.length > 0) {
    throw new Error(
      `Mintegral export contains resources outside its ZIP: ${unavailableResources.join(', ')}.`,
    );
  }
}

/** Enforces Mintegral's maximum compressed delivery size. */
export function validateMintegralArchive(archive: Uint8Array): void {
  if (isWithinExportSizeLimit(archive.byteLength, 'mintegral')) {
    return;
  }

  const formattedSize = archive.byteLength.toLocaleString('en-US');

  throw new Error(`Mintegral export exceeds the 5 MB limit: ${formattedSize} bytes.`);
}
