import { load } from 'cheerio';

import { isWithinExportSizeLimit, GOOGLE_MAX_ARCHIVE_FILE_COUNT } from '#shared/export-limits.js';
import { requirePlayableHtml } from '#shared/playable-html.js';
import type { ExportFile } from '#types/export-file.js';

import { validateBuildEntryOrder } from '../build-entries.js';
import {
  collectUnavailableResourceReferences,
  isAvailableArchiveResourceReference,
} from '../resource-references.js';

const EXIT_API_URL = 'https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js';
const ORIENTATIONS = new Set(['landscape', 'portrait', 'portrait,landscape']);
const SUPPORTED_ARCHIVE_PATH = /^[A-Za-z\d._/-]+$/u;

/** Enforces every Google rule that can be proven from prepared archive files. */
export function validateGoogleFiles(files: readonly ExportFile[], variantId: string): void {
  const html = requirePlayableHtml(files, variantId);

  validateFileCount(files);
  validateArchivePaths(files);
  validateDocument(new TextDecoder().decode(html.data), files, variantId);
  validateExitCall(files);
}

/** Enforces Google's documented maximum compressed archive size. */
export function validateGoogleArchive(archive: Uint8Array): void {
  if (isWithinExportSizeLimit(archive.byteLength, 'google')) {
    return;
  }

  const formattedSize = archive.byteLength.toLocaleString('en-US');

  throw new Error(`Google archive exceeds its 5 MB limit: ${formattedSize} bytes.`);
}

/** Enforces Google's documented maximum number of files inside the ZIP. */
function validateFileCount(files: readonly ExportFile[]): void {
  if (files.length > GOOGLE_MAX_ARCHIVE_FILE_COUNT) {
    throw new Error(
      `Google archive contains ${files.length} files; the maximum is ${GOOGLE_MAX_ARCHIVE_FILE_COUNT}.`,
    );
  }
}

/** Rejects archive paths containing characters unsupported by Google Ads. */
function validateArchivePaths(files: readonly ExportFile[]): void {
  const invalidPaths = files
    .map(({ path }) => path)
    .filter((archivePath) => !SUPPORTED_ARCHIVE_PATH.test(archivePath));

  if (invalidPaths.length > 0) {
    throw new Error(`Google archive contains unsupported paths: ${invalidPaths.join(', ')}.`);
  }
}

/** Validates Google's required document structure, metadata, and resource policy. */
function validateDocument(source: string, files: readonly ExportFile[], variantId: string): void {
  const document = load(source);

  validateBuildEntryOrder(document, variantId);

  if (!source.trimStart().toLowerCase().startsWith('<!doctype html>')) {
    throw new Error('Google entry document must begin with <!DOCTYPE html>.');
  }

  if (
    document('html').length !== 1 ||
    document('head').length !== 1 ||
    document('body').length !== 1
  ) {
    throw new Error('Google entry document must contain one html, head, and body element.');
  }

  const charset = document('head > meta[charset]').attr('charset')?.toLowerCase();

  if (charset !== 'utf-8') {
    throw new Error('Google entry document must declare UTF-8 encoding.');
  }

  const orientation = document('head > meta[name="ad.orientation"]').attr('content');

  if (orientation === undefined || !ORIENTATIONS.has(orientation)) {
    throw new Error('Google entry document has no valid ad.orientation metadata.');
  }

  const exitApiScripts = document(`head > script[src="${EXIT_API_URL}"]`);

  if (exitApiScripts.length !== 1) {
    throw new Error('Google entry document must load the official Exit API exactly once.');
  }

  validateResourceReferences(document, files);
}

/** Allows the official Exit API and requires every other resource to live in the ZIP. */
function validateResourceReferences(
  document: ReturnType<typeof load>,
  files: readonly ExportFile[],
): void {
  const archivePaths = new Set(files.map(({ path }) => path));
  const unavailableResources = collectUnavailableResourceReferences(
    document,
    (reference) =>
      reference === EXIT_API_URL || isAvailableArchiveResourceReference(reference, archivePaths),
  );

  if (unavailableResources.length > 0) {
    throw new Error(
      `Google archive contains unavailable resources: ${unavailableResources.join(', ')}.`,
    );
  }
}

/** Ensures the bundled CTA path invokes Google's network-owned destination API. */
function validateExitCall(files: readonly ExportFile[]): void {
  const decoder = new TextDecoder();
  const invokesExitApi = files
    .filter(({ path }) => path.endsWith('.js'))
    .some(({ data }) => decoder.decode(data).includes('ExitApi.exit()'));

  if (!invokesExitApi) {
    throw new Error('Google archive does not invoke ExitApi.exit().');
  }
}
