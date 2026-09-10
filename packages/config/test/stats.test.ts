import { expect, it } from 'vitest';

import { statsSchema } from '../src/config/schemas/stats.js';

const enabled = {
  display: 'expanded',
  fps: true,
  frameInterval: true,
  jsHeap: true,
  drawCalls: true,
  textureBinds: true,
  programUses: true,
};

it.each([true, {}])('requests every metric for shorthand %j', (input) => {
  expect(statsSchema.parse(input)).toEqual(enabled);
});

it.each(['drawCalls', 'textureBinds', 'programUses'] as const)(
  'disables %s independently while retaining other defaults',
  (key) => {
    expect(statsSchema.parse({ [key]: false })).toEqual({ ...enabled, [key]: false });
  },
);

it('allows all six metrics to be disabled without disabling the stats settings object', () => {
  const disabled = {
    display: 'compact',
    fps: false,
    frameInterval: false,
    jsHeap: false,
    drawCalls: false,
    textureBinds: false,
    programUses: false,
  };
  expect(statsSchema.parse(disabled)).toEqual(disabled);
});

it.each([false, undefined])('keeps omitted or disabled stats inactive: %j', (input) => {
  expect(statsSchema.parse(input)).toBe(false);
});
