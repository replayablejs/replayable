import { expect, it } from 'vitest';

import { devtoolsSchema } from '../src/config/schemas/devtools.js';

it('defaults the development sound control off', () => {
  expect(devtoolsSchema.parse(undefined).soundControl).toBe(false);
});

it.each([true, false])('accepts soundControl: %s', (soundControl) => {
  expect(devtoolsSchema.parse({ soundControl }).soundControl).toBe(soundControl);
});

it.each(['true', 1, null])('rejects non-boolean sound control settings: %j', (soundControl) => {
  expect(devtoolsSchema.safeParse({ soundControl }).success).toBe(false);
});
