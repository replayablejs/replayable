import { expect, it } from 'vitest';

import { localizationSchema } from '../src/config/schemas/localization.js';

it.each([
  ['en', 'EN'],
  ['en-US', 'en-us'],
  ['he', 'iw'],
])('rejects equivalent tags %s and %s', (first, second) => {
  const result = localizationSchema.safeParse({ fallback: first, languages: [first, second] });
  expect(result.success).toBe(false);
  expect(result.error?.issues).toContainEqual(expect.objectContaining({ path: ['languages'] }));
});

it('preserves authored spelling and allows distinct regional variants', () => {
  const localization = { fallback: 'en-us', languages: ['en-us', 'en-GB', 'hy'] };
  expect(localizationSchema.parse(localization)).toEqual(localization);
});

it.each(['invalid_tag', '', 'x'])(
  'reports invalid tag %j without a canonicalization exception',
  (language) => {
    expect(
      localizationSchema.safeParse({ fallback: 'en', languages: ['en', language] }).success,
    ).toBe(false);
  },
);

it('still requires the authored fallback to appear in the language list', () => {
  expect(localizationSchema.safeParse({ fallback: 'hy', languages: ['en'] }).success).toBe(false);
});
