import type { ExportFile } from '#types/export-file.js';

/** Canonical entry document produced by every Replayable build. */
export const PLAYABLE_HTML_FILE = 'index.html';

/** Returns the required playable entry document from a collected build. */
export function requirePlayableHtml(files: readonly ExportFile[], variantId: string): ExportFile {
  const html = files.find(({ path }) => path === PLAYABLE_HTML_FILE);

  if (html === undefined) {
    throw new Error(`Build ${variantId} does not contain a root ${PLAYABLE_HTML_FILE}.`);
  }

  return html;
}
