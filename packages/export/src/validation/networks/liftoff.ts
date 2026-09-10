import { load } from 'cheerio';

import { isWithinExportSizeLimit } from '#shared/export-limits.js';
import { requirePlayableHtml } from '#shared/playable-html.js';
import type { ExportFile } from '#types/export-file.js';

import { validateBuildEntryOrder } from '../build-entries.js';
import {
  collectUnavailableResourceReferences,
  isAvailableArchiveResourceReference,
} from '../resource-references.js';

const ASCII_ARCHIVE_PATH = /^[\x20-\x7e]+$/u;

/** Enforces Liftoff's HTML size, archive path, and local-resource requirements. */
export function validateLiftoffFiles(files: readonly ExportFile[], variantId: string): void {
  const html = requirePlayableHtml(files, variantId);

  validateHtmlSize(html);
  validateArchivePaths(files);
  validateDocument(new TextDecoder().decode(html.data), files, variantId);
}

/** Enforces Liftoff's documented maximum entry-document size. */
function validateHtmlSize(html: ExportFile): void {
  if (!isWithinExportSizeLimit(html.data.byteLength, 'liftoff')) {
    const formattedSize = html.data.byteLength.toLocaleString('en-US');

    throw new Error(`Liftoff HTML exceeds its 5 MB limit: ${formattedSize} bytes.`);
  }
}

/** Rejects filenames that Liftoff's case-sensitive CDN cannot address reliably. */
function validateArchivePaths(files: readonly ExportFile[]): void {
  const invalidPaths = files
    .map(({ path }) => path)
    .filter((archivePath) => !ASCII_ARCHIVE_PATH.test(archivePath));

  if (invalidPaths.length > 0) {
    throw new Error(`Liftoff export contains non-ASCII filenames: ${invalidPaths.join(', ')}.`);
  }
}

/** Enforces Liftoff's supported document shape and local-only resource policy. */
function validateDocument(source: string, files: readonly ExportFile[], variantId: string): void {
  const document = load(source);

  validateBuildEntryOrder(document, variantId);

  if (document('iframe').length > 0) {
    throw new Error('Liftoff export must not contain iframe elements.');
  }

  const archivePaths = new Set(files.map(({ path }) => path));
  const unavailableResources = collectUnavailableResourceReferences(document, (reference) =>
    isAvailableArchiveResourceReference(reference, archivePaths),
  );

  if (unavailableResources.length > 0) {
    throw new Error(
      `Liftoff export contains unavailable resources: ${unavailableResources.join(', ')}.`,
    );
  }
}
