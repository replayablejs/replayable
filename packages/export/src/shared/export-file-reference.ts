import { posix } from 'node:path';

/** Converts a relative document URL into its normalized export-file path. */
export function resolveExportFileReference(reference: string): string | undefined {
  if (
    reference === '' ||
    reference.startsWith('//') ||
    reference.startsWith('/') ||
    /^[a-z][a-z\d+.-]*:/iu.test(reference)
  ) {
    return undefined;
  }

  const encodedPath = reference.split(/[?#]/u, 1)[0];

  if (encodedPath === undefined || encodedPath === '') {
    return undefined;
  }

  let decodedPath: string;

  try {
    decodedPath = decodeURIComponent(encodedPath);
  } catch {
    return undefined;
  }

  const exportFilePath = posix.normalize(decodedPath);

  if (
    exportFilePath === '..' ||
    exportFilePath.startsWith('../') ||
    posix.isAbsolute(exportFilePath)
  ) {
    return undefined;
  }

  return exportFilePath;
}
