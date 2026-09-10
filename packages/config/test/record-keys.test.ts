import { expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';

import { paramDefinitionSchema, paramsSchema } from '../src/config/schemas/params.js';
import { networksSchema, versionsSchema } from '../src/config/schemas/variants.js';

const booleanParam = { type: 'boolean', default: true, description: 'Toggle' } as const;

it('rejects parameter definitions that collide after trimming', () => {
  const schema = z.strictObject({ params: paramsSchema });
  const result = schema.safeParse({
    params: { speed: booleanParam, ' speed ': { ...booleanParam, default: false } },
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues).toContainEqual(
    expect.objectContaining({ path: ['params', ' speed '] }),
  );
});

it('rejects version names that would discard an override', () => {
  expect(versionsSchema.safeParse({ default: { audio: false }, ' default ': {} }).success).toBe(
    false,
  );
});

it('rejects colliding parameter override keys in both dimensions', () => {
  const params = { speed: true, ' speed ': false };
  expect(versionsSchema.safeParse({ default: { params } }).success).toBe(false);
  expect(networksSchema.safeParse({ preview: { params } }).success).toBe(false);
});

it('still trims unambiguous keys and preserves authored values', () => {
  expect(paramsSchema.parse({ ' speed ': booleanParam })).toEqual({ speed: booleanParam });
  expect(versionsSchema.parse({ ' default ': { audio: false } })).toEqual({
    default: { audio: false },
  });
  expect(networksSchema.parse({ preview: { params: { ' speed ': false } } })).toEqual({
    preview: { params: { speed: false } },
  });
});

it('retains schema defaults and rejects malformed record shapes', () => {
  expect(paramsSchema.parse(undefined)).toEqual({});
  expect(versionsSchema.parse(undefined)).toEqual({ default: {} });
  for (const value of [null, [], 'text', 1]) {
    expect(paramsSchema.safeParse(value).success).toBe(false);
    expect(versionsSchema.safeParse(value).success).toBe(false);
  }
});

it('preserves the public authored parameter type instead of widening it to unknown', () => {
  expectTypeOf<z.input<typeof paramsSchema>>().toEqualTypeOf<
    Record<string, z.input<typeof paramDefinitionSchema>> | undefined
  >();
});
