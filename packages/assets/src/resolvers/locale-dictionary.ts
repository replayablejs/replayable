import { parse, printParseErrorCode, type ParseError } from 'jsonc-parser';

import type { LocalizationConfig } from '#types/config.js';
import type { ResolvedLocaleDictionary } from '#types/resolved-assets.js';

/**
 * Parses one locale source and selects the build language or its fallback.
 *
 * This function performs no filesystem work. Locale emission and automatic
 * font subsetting can therefore consume the same fixed-language dictionary
 * without parsing or resolving translations independently.
 */
export function resolveLocaleDictionary(
  source: string,
  relativePath: string,
  localization: LocalizationConfig,
): ResolvedLocaleDictionary {
  const { fallback, language } = localization;
  const errors: ParseError[] = [];
  const parsed: unknown = parse(source, errors, { allowTrailingComma: true });

  if (errors.length > 0) {
    throw localeParseError(relativePath, source, errors[0]);
  }

  if (parsed === undefined) {
    throw new Error(`Locale is empty: ${relativePath}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Locale must be an object: ${relativePath}`);
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([key, translations]) => {
      if (
        typeof translations !== 'object' ||
        translations === null ||
        Array.isArray(translations)
      ) {
        throw new Error(`Locale phrase ${JSON.stringify(key)} must contain language values.`);
      }

      const selectedLanguage = language in translations ? language : fallback;

      if (!(selectedLanguage in translations)) {
        throw new Error(
          `Locale phrase ${JSON.stringify(key)} is missing language ${JSON.stringify(language)} and fallback ${JSON.stringify(fallback)}.`,
        );
      }

      const selectedTranslation = translations[selectedLanguage];

      if (typeof selectedTranslation !== 'string') {
        throw new Error(
          `Locale phrase ${JSON.stringify(key)} language ${JSON.stringify(selectedLanguage)} must be a string.`,
        );
      }

      return [key, selectedTranslation];
    }),
  );
}

function localeParseError(
  relativePath: string,
  source: string,
  error: ParseError | undefined,
): Error {
  if (error === undefined) {
    return new Error(`Invalid locale: ${relativePath}`);
  }

  const beforeError = source.slice(0, error.offset);
  const line = beforeError.split('\n').length;
  const lastNewline = beforeError.lastIndexOf('\n');
  const column = error.offset - lastNewline;

  return new Error(
    `Invalid locale ${relativePath}:${line}:${column}: ${printParseErrorCode(error.error)}`,
  );
}
