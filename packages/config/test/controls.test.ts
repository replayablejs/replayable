import { expect, it } from 'vitest';

import { controlsSchema } from '../src/config/schemas/controls.js';

it.each([undefined, {}])('defaults the preview CTA to enabled: %j', (input) => {
  expect(controlsSchema.parse(input)).toEqual({ persistentCta: true });
});

it.each(['persistentCta'])('can disable %s', (key) => {
  expect(controlsSchema.parse({ [key]: false })).toEqual({
    persistentCta: true,
    [key]: false,
  });
});

it.each([false, null, { persistentCta: 'false' }, { sound: true }, { unknown: true }])(
  'rejects invalid control preferences: %j',
  (input) => {
    expect(controlsSchema.safeParse(input).success).toBe(false);
  },
);
