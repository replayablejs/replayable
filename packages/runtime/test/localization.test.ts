import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createAssetLoader } from '../src/loader/create-asset-loader.js';
import { createLocalization } from '../src/localization/create-localization.js';

describe('localization dictionary ownership', () => {
  const originalHasOwn = Object.hasOwn;

  // Exercise every ownership case under Mintegral's missing-API condition.
  beforeEach(() => {
    Object.defineProperty(Object, 'hasOwn', { value: undefined });
  });

  afterEach(() => {
    Object.defineProperty(Object, 'hasOwn', { value: originalHasOwn });
  });

  it('rejects inherited keys instead of returning Object prototype values', async () => {
    const loader = createAssetLoader(
      { primary: { locales: { translations: { hello: 'Hello' } } } },
      'inline',
    );
    const localization = createLocalization({ language: 'en' }, loader);
    await loader.load('primary');

    expect(localization.translate('hello')).toBe('Hello');
    for (const phrase of ['constructor', 'toString', '__proto__', 'missing']) {
      expect(() => localization.translate(phrase)).toThrow('was not found');
    }
  });

  it('accepts authored prototype-like keys and empty translations', async () => {
    const translations = { ['__proto__']: 'Prototype', constructor: 'Constructor', empty: '' };
    const loader = createAssetLoader({ primary: { locales: { translations } } }, 'inline');
    const localization = createLocalization({ language: 'en' }, loader);
    await loader.load('primary');

    expect(localization.translate('__proto__')).toBe('Prototype');
    expect(localization.translate('constructor')).toBe('Constructor');
    expect(localization.translate('empty')).toBe('');
  });
});
