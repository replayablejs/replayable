import { readFile } from 'node:fs/promises';

import subsetFont from 'subset-font';

/**
 * Loads one source font and returns WOFF2 bytes containing the required glyphs.
 *
 * `charset` is text rather than a list of glyph identifiers. The subsetting
 * engine reads its Unicode characters, keeps the glyphs needed to render them,
 * and may retain related glyphs required by the font's layout substitutions.
 * Duplicate characters do not produce duplicate glyphs.
 *
 * TTF, OTF, WOFF, and WOFF2 sources all cross this adapter boundary as raw
 * bytes and always return WOFF2 bytes. This function does not write a file;
 * the font processor owns the generated output path and filesystem write.
 * Source-read errors and invalid or unsupported font errors intentionally
 * propagate to that processor with their original diagnostics.
 *
 * @param sourcePath - Absolute path of the authored source font.
 * @param charset - Complete text whose characters must remain renderable.
 * @returns Encoded WOFF2 font bytes ready to be written by the processor.
 *
 * @example
 *
 * ```ts
 * const woff2 = await createWoff2Subset(
 *   '/project/raw-assets/fonts/interface.ttf',
 *   'ABCDEFGHIJKLMNOPQRSTUVWXYZԲարև',
 * );
 * ```
 */
export async function createWoff2Subset(sourcePath: string, charset: string): Promise<Uint8Array> {
  const sourceFont = await readFile(sourcePath);

  return subsetFont(sourceFont, charset, { targetFormat: 'woff2' });
}
