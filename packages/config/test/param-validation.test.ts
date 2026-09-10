import { expect, it } from 'vitest';
import { z } from 'zod';

import { paramsSchema } from '../src/config/schemas/params.js';
import { networksSchema, versionsSchema } from '../src/config/schemas/variants.js';
import { validateParamOverrides } from '../src/config/validation/params.js';

const schema = z.strictObject({ params: paramsSchema });
const numberParam = {
  type: 'number',
  description: 'Difficulty',
  default: 1,
  range: { min: 0, max: 2, step: 1 },
} as const;

it.each([
  [{ ...numberParam, default: 9 }, ['default']],
  [{ ...numberParam, default: 0.5 }, ['default']],
  [{ ...numberParam, range: { min: 3, max: 2, step: 1 } }, ['range']],
  [{ ...numberParam, range: { min: 0, max: 2, step: 0.75 } }, ['range', 'step']],
  [{ type: 'string', description: 'Theme', default: 'missing', options: ['one'] }, ['default']],
  [{ type: 'string', description: 'Theme', default: 'one', options: ['one', 'one'] }, ['options']],
  [{ ...numberParam, when: { param: 'missing', equals: 1 } }, ['when', 'param']],
])('reports the exact parameter-relative path for %j', (definition, suffix) => {
  const result = schema.safeParse({ params: { difficulty: definition } });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0]?.path).toEqual(['params', 'difficulty', ...suffix]);
});

it('keeps project-relative override paths unchanged', () => {
  const project = z
    .strictObject({ params: paramsSchema, networks: networksSchema, versions: versionsSchema })
    .superRefine(({ params, networks, versions }, context) => {
      validateParamOverrides('networks', networks, params, context);
      validateParamOverrides('versions', versions, params, context);
    });
  const result = project.safeParse({
    params: { difficulty: numberParam },
    networks: { preview: { params: { difficulty: 0.5 } } },
    versions: { default: { params: { unknown: true } } },
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues.map(({ path }) => path)).toEqual([
    ['networks', 'preview', 'params', 'difficulty'],
    ['versions', 'default', 'params', 'unknown'],
  ]);
});

it('keeps fractional steps valid despite ordinary floating-point rounding', () => {
  expect(
    schema.safeParse({
      params: {
        difficulty: { ...numberParam, default: 0.3, range: { min: 0, max: 1, step: 0.1 } },
      },
    }).success,
  ).toBe(true);
});
