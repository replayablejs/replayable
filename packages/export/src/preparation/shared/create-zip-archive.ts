import { Zip, ZipDeflate } from 'fflate';

import type { ExportFile } from '#types/export-file.js';

/** Compresses prepared export files at the highest supported compression level. */
export function createZipArchive(files: readonly ExportFile[]): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const archive = new Zip((error, chunk, final) => {
      if (error !== null) {
        reject(error);
        return;
      }

      chunks.push(chunk);

      if (final) {
        resolve(Buffer.concat(chunks));
      }
    });

    // Add filenames directly instead of using fflate's object shorthand. Plain
    // objects treat a root filename such as "__proto__" as a special property.
    for (const file of files) {
      const archiveFile = new ZipDeflate(file.path, { level: 9 });

      archive.add(archiveFile);
      archiveFile.push(file.data, true);
    }

    archive.end();
  });
}
