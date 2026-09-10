import { describe, expect, it } from 'vitest';

import { resolveLocaleDictionary } from '#resolvers/locale-dictionary.js';

describe('locale dictionary resolution', () => {
  it('keeps the selected translation and falls back only when it is absent', () => {
    const resolved = resolveLocaleDictionary(
      '{ // fixed-language input\n "play": { "en": "Play", "hy": "Խաղալ" }, "install": { "en": "Install" }, }',
      'locales/translations.jsonc',
      { fallback: 'en', language: 'hy' },
    );

    expect(resolved).toEqual({
      install: 'Install',
      play: 'Խաղալ',
    });
  });

  it('rejects a selected translation that is not a string', () => {
    expect(() =>
      resolveLocaleDictionary(
        '{ "play": { "en": "Play", "hy": 42 } }',
        'locales/translations.json',
        { fallback: 'en', language: 'hy' },
      ),
    ).toThrow('Locale phrase "play" language "hy" must be a string.');
  });

  it('rejects a fallback translation that is not a string', () => {
    expect(() =>
      resolveLocaleDictionary('{ "play": { "en": ["Play"] } }', 'locales/translations.json', {
        fallback: 'en',
        language: 'hy',
      }),
    ).toThrow('Locale phrase "play" language "en" must be a string.');
  });

  it('ignores invalid values belonging to unselected languages', () => {
    expect(
      resolveLocaleDictionary(
        '{ "play": { "en": "Play", "fr": 42 } }',
        'locales/translations.json',
        { fallback: 'hy', language: 'en' },
      ),
    ).toEqual({ play: 'Play' });
  });
});
