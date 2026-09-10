import type { ResolvedLocaleDictionary } from '#types/resolved-assets.js';

const DEFAULT_FONT_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

/**
 * Collects the unique Unicode characters used by resolved locale values.
 *
 * Locale keys are metadata, so they do not contribute to a font subset. The
 * resolver has already selected the build language or its fallback; this
 * function therefore sees only text that can appear in the current build.
 *
 * Characters retain their first-seen order across files and phrases. For
 * example, `{ play: 'Խաղալ' }` contributes `Խաղալ`, while `play` contributes
 * no characters.
 */
export function collectLocaleCharacters(dictionaries: Iterable<ResolvedLocaleDictionary>): string {
  const characters = new Set<string>();

  for (const dictionary of dictionaries) {
    for (const translation of Object.values(dictionary)) {
      for (const character of translation) {
        characters.add(character);
      }
    }
  }

  return [...characters].join('');
}

/**
 * Creates the complete subset charset for one generated font.
 *
 * Every font starts with printable ASCII so common UI text, numbers, and
 * punctuation remain available even when they are absent from locale files.
 * Characters used by the selected locale come next, followed by characters
 * explicitly requested for this font. Duplicate code points retain the
 * position of their first occurrence.
 */
export function createFontCharset(
  localeCharacters: string,
  extraCharacters: string | undefined,
): string {
  const characters = new Set(DEFAULT_FONT_CHARSET);

  for (const character of localeCharacters) {
    characters.add(character);
  }

  for (const character of extraCharacters ?? '') {
    characters.add(character);
  }

  return [...characters].join('');
}
