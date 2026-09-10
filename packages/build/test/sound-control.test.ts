import { expect, it } from 'vitest';

import { resolveSoundControl } from '../src/runtime/resolve-devtools.js';

it('selects the sound control only for opted-in development', () => {
  expect(resolveSoundControl('serve', true)).toMatch(/sound-control[/\\]enabled\.js$/);
  expect(resolveSoundControl('serve', false)).toMatch(/sound-control[/\\]disabled\.js$/);
  expect(resolveSoundControl('build', true)).toMatch(/sound-control[/\\]disabled\.js$/);
  expect(resolveSoundControl('build', false)).toMatch(/sound-control[/\\]disabled\.js$/);
});
