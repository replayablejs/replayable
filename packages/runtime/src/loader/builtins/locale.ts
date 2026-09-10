import type { LocaleDictionary } from '#types/assets.js';
import type { AssetLoadHandler } from '#types/loader.js';

/** Resolves inline or externally emitted fixed-language translations. */
export const loadLocale: AssetLoadHandler<'locales', LocaleDictionary> = async ({ source }) => {
  if (typeof source !== 'string') {
    assertLocaleDictionary(source, 'Inline locale');

    return source;
  }

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Unable to load locale ${source}: ${response.status} ${response.statusText}.`);
  }

  const dictionary: unknown = await response.json();

  assertLocaleDictionary(dictionary, `Locale ${source}`);

  return dictionary;
};

/** Validates translations before exposing them to playable code. */
function assertLocaleDictionary(
  value: unknown,
  description: string,
): asserts value is LocaleDictionary {
  const valid =
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((translation) => typeof translation === 'string');

  if (!valid) {
    throw new Error(`${description} must contain string translation values.`);
  }
}
