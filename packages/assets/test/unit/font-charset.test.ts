import { describe, expect, it } from 'vitest';

import { collectLocaleCharacters, createFontCharset } from '#resolvers/font-charset.js';

describe('font charset', () => {
  it('collects values across dictionaries in first-seen order', () => {
    const characters = collectLocaleCharacters([
      {
        installButton: 'Install',
        playButton: 'Խաղալ',
      },
      {
        rewardTitle: 'Մրցանակ 🎁',
      },
    ]);

    expect(characters).toBe('InstalԽաղլՄրցնկ 🎁');
  });

  it('deduplicates Unicode code points without normalizing text', () => {
    const characters = collectLocaleCharacters([
      {
        composed: 'é',
        decomposed: 'e\u0301',
        emoji: '🎁🎁',
      },
    ]);

    // Precomposed `é` and `e` plus a combining acute accent are distinct font
    // code points. The repeated emoji contributes only one code point.
    expect(characters).toBe('ée\u0301🎁');
    expect(Array.from(characters)).toHaveLength(4);
  });

  it('uses exactly printable ASCII when no other characters are required', () => {
    const charset = createFontCharset('', undefined);

    expect(Array.from(charset)).toHaveLength(95);

    for (let codePoint = 32; codePoint <= 126; codePoint += 1) {
      expect(charset).toContain(String.fromCodePoint(codePoint));
    }
  });

  it('combines printable ASCII, locale characters, and font-specific extras', () => {
    const charset = createFontCharset('Խաղալ A🎁', '֏ԽZ🎁');

    for (let codePoint = 32; codePoint <= 126; codePoint += 1) {
      expect(charset).toContain(String.fromCodePoint(codePoint));
    }

    expect(Array.from(charset)).toHaveLength(101);
    expect(charset).toMatch(/Խաղլ🎁֏$/u);
  });
});
