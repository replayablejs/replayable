import { z } from 'zod';

import { requiredStringSchema } from './base.js';

const languageSchema = requiredStringSchema.refine(isLanguageTag, {
  message: 'Language must be a valid BCP 47 tag.',
  // Canonical uniqueness below only runs after every tag is known to be valid.
  abort: true,
});

/** Languages expanded into fixed-language variants and their missing-value fallback. */
export const localizationSchema = z
  .strictObject({
    languages: z.array(languageSchema).min(1),
    fallback: languageSchema,
  })
  .superRefine(({ fallback, languages }, context) => {
    // Preserve authored spelling for asset lookup, but reject equivalent language identities.
    if (Intl.getCanonicalLocales(languages).length !== languages.length) {
      context.addIssue({
        code: 'custom',
        message: 'Localization languages must be unique after BCP 47 canonicalization.',
        path: ['languages'],
      });
    }

    if (!languages.includes(fallback)) {
      context.addIssue({
        code: 'custom',
        message: 'The fallback language must also appear in localization.languages.',
        path: ['fallback'],
      });
    }
  });

/** Uses the runtime's Unicode locale data instead of maintaining a fixed language list. */
function isLanguageTag(language: string): boolean {
  try {
    Intl.getCanonicalLocales(language);

    return true;
  } catch {
    return false;
  }
}
