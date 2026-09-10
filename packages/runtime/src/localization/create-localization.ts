import type { LocaleDictionary } from '#types/assets.js';
import type { AssetLoader } from '#types/loader.js';
import type { Localization } from '#types/localization.js';
import type { RuntimeLocalizationConfig } from '#types/runtime.js';

/** Retains the generated dictionary when its built-in loader completes. */
export function createLocalization(
  config: RuntimeLocalizationConfig,
  loader: AssetLoader,
): Localization {
  let translations: LocaleDictionary | undefined;

  const stopListening = loader.onLoaded('locales', ({ value }) => {
    translations = value;
    stopListening();
  });

  return {
    language: config.language,

    translate(phrase): string {
      if (translations === undefined) {
        throw new Error('The locale asset must be loaded before translating phrases.');
      }

      // Some network test environments lack Object.hasOwn; retain own-key safety.
      const translation = Object.prototype.hasOwnProperty.call(translations, phrase)
        ? translations[phrase]
        : undefined;

      if (translation === undefined) {
        throw new Error(
          `Translation ${JSON.stringify(phrase)} was not found in the loaded locale asset.`,
        );
      }

      return translation;
    },
  };
}
