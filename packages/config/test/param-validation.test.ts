import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';

import {
  paramDefinitionSchema,
  paramsSchema,
  scalarParamDefinitionSchema,
} from '../src/config/schemas/params.js';
import { networksSchema, versionsSchema } from '../src/config/schemas/variants.js';
import { validateParamOverrides } from '../src/config/validation/params.js';
import type {
  ReplayableParamDefinition,
  ReplayableParamCondition,
  ReplayableParamMetadata,
  ReplayableParamsInput,
  ReplayableParamValue,
  ReplayableRangeParamDefinition,
  ReplayableScalarParamDefinition,
  ReplayableSelectOption,
  ReplayableSelectParamDefinition,
} from '../src/index.js';

const schema = z.strictObject({ params: paramsSchema });
const range = { type: 'range', label: 'Difficulty', default: 1, min: 0, max: 2, step: 1 } as const;
const toggle = { type: 'boolean', label: 'Enabled', default: true } as const;
const text = { type: 'text', label: 'Message', default: 'Hello' } as const;
const select = {
  type: 'select',
  label: 'Theme',
  default: 'one',
  options: [{ name: 'One', value: 'one' }],
} as const;
const group = {
  type: 'object',
  label: 'Tutorial',
  parameters: { enabled: toggle, delay: range, message: text },
} as const;

const project = z
  .strictObject({ params: paramsSchema, networks: networksSchema, versions: versionsSchema })
  .superRefine(({ params, networks, versions }, context) => {
    validateParamOverrides('networks', networks, params, context);
    validateParamOverrides('versions', versions, params, context);
  });

describe('parameter definitions', () => {
  it('accepts all seven types with Studio metadata and preserves value strings', () => {
    const definitions = {
      number: { type: 'number', label: ' Number ', default: -2.75 },
      boolean: toggle,
      text: { ...text, default: ' \n  Hello \n ' },
      range,
      color: { type: 'color', label: 'Color', default: '#Aa00Ff' },
      select: {
        type: 'select',
        label: 'Choice',
        default: ' one ',
        options: [{ name: ' One ', value: ' one ' }],
      },
      object: { ...group, info: ' Help ', category: ' Gameplay ' },
    } satisfies ReplayableParamsInput;
    const result = paramsSchema.parse(definitions);
    expect(result.text).toMatchObject({ default: ' \n  Hello \n ' });
    expect(result.select).toMatchObject({
      default: ' one ',
      options: [{ name: 'One', value: ' one ' }],
    });
    expect(result.color).toMatchObject({ default: '#Aa00Ff' });
    expect(result.number).toMatchObject({ label: 'Number', default: -2.75 });
    expect(result.object).toMatchObject({ info: 'Help', category: 'Gameplay' });
  });

  it.each(['', ' ', '\n', '👋 "Hello" <world>'])('preserves free text %j', (value) => {
    expect(paramsSchema.parse({ message: { ...text, default: value } }).message).toMatchObject({
      default: value,
    });
  });

  it.each([
    { ...toggle, label: '' },
    { ...toggle, label: ' ' },
    { ...toggle, label: undefined },
    { ...toggle, default: undefined },
    { ...toggle, default: 'true' },
    { ...toggle, info: ' ' },
    { ...toggle, category: '' },
    { ...toggle, unknown: true },
    { ...toggle, description: 'Old metadata' },
    { ...toggle, highlightable: true },
    { type: 'string', label: 'Old string', default: 'one', options: ['one'] },
    { type: 'number', label: 'Old range', default: 1, range: { min: 0, max: 2, step: 1 } },
    { type: 'number', label: 'Number', default: 1, min: 0 },
    { type: 'number', label: 'Number', default: '1' },
    { type: 'number', label: 'Number', default: Infinity },
    { type: 'number', label: 'Number', default: -Infinity },
    { type: 'number', label: 'Number', default: NaN },
    { ...text, default: null },
    { ...text, default: [] },
    { ...text, options: ['one'] },
    { ...range, min: -Infinity },
    { ...range, max: Infinity },
    { ...range, step: 0 },
    { ...range, step: -1 },
    { ...range, step: NaN },
    { ...range, default: Infinity },
    { ...select, options: [] },
    { ...select, options: ['one'] },
    { ...select, options: [{ value: 'one' }] },
    { ...select, options: [{ name: '', value: 'one' }] },
    { ...select, options: [{ name: 'One', value: '' }] },
    { ...select, options: [{ name: 'One', value: 1 }] },
    { ...select, options: [{ name: 'One', value: true }] },
    { ...select, options: [{ name: 'One', value: 'one', extra: true }] },
    { ...select, default: 1 },
    { ...group, parameters: {} },
    { ...group, parameters: { nested: group } },
    { ...group, default: {} },
    { ...group, optional: true },
  ])('rejects malformed or legacy definition %j', (definition) => {
    expect(paramsSchema.safeParse({ setting: definition }).success).toBe(false);
  });

  it.each(['audio', 'image', 'video', 'table', 'coordinates', 'alignment', 'asset_3d', 'rgba'])(
    'rejects excluded type %s',
    (type) => {
      expect(
        paramsSchema.safeParse({ setting: { type, label: 'Setting', default: 'x' } }).success,
      ).toBe(false);
    },
  );

  it.each([
    '#fff',
    '#ffffff00',
    'red',
    'rgb(0, 0, 0)',
    'ffffff',
    '#ggffff',
    ' #ffffff',
    '#ffffff\n',
  ])('rejects invalid color %j', (value) => {
    expect(
      paramsSchema.safeParse({ color: { type: 'color', label: 'Color', default: value } }).success,
    ).toBe(false);
  });

  it.each([
    [{ ...range, default: 9 }, ['default']],
    [{ ...range, default: 0.5 }, ['default']],
    [{ ...range, min: 3, max: 2 }, ['min']],
    [{ ...range, step: 0.75 }, ['step']],
    [{ ...select, default: 'missing' }, ['default']],
    [
      {
        ...select,
        options: [
          { name: 'One', value: 'one' },
          { name: 'Other', value: 'one' },
        ],
      },
      ['options'],
    ],
  ])('reports exact root and child constraint paths for %j', (definition, suffix) => {
    const root = schema.safeParse({ params: { setting: definition } });
    expect(root.success).toBe(false);
    expect(root.error?.issues[0]?.path).toEqual(['params', 'setting', ...suffix]);
    const nested = schema.safeParse({
      params: { group: { ...group, parameters: { setting: definition } } },
    });
    expect(nested.success).toBe(false);
    expect(nested.error?.issues[0]?.path).toEqual([
      'params',
      'group',
      'parameters',
      'setting',
      ...suffix,
    ]);
  });

  it.each([
    { ...range, min: 0, max: 1, step: 0.1, default: 0.3 },
    { ...range, min: -1, max: 1, step: 0.25, default: -0.75 },
    { ...range, min: 1, max: 1, step: 0.25, default: 1 },
  ])('accepts fractional and single-value ranges %j', (definition) => {
    expect(paramsSchema.safeParse({ setting: definition }).success).toBe(true);
  });

  it('normalizes names at each level and rejects child collisions', () => {
    expect(
      paramsSchema.parse({ ' tutorial ': { ...group, parameters: { ' enabled ': toggle } } }),
    ).toEqual({ tutorial: { ...group, parameters: { enabled: toggle } } });
    const result = schema.safeParse({
      params: { tutorial: { ...group, parameters: { enabled: toggle, ' enabled ': toggle } } },
    });
    expect(result.error?.issues[0]?.path).toEqual([
      'params',
      'tutorial',
      'parameters',
      ' enabled ',
    ]);
    expect(paramsSchema.safeParse({ ' ': toggle }).success).toBe(false);
    expect(
      paramsSchema.safeParse({ tutorial: { ...group, parameters: { ' ': toggle } } }).success,
    ).toBe(false);
  });

  it('keeps public types constrained to scalars and one-level objects', () => {
    expectTypeOf<Exclude<ReplayableParamsInput, undefined>>().toEqualTypeOf<
      Record<string, ReplayableParamDefinition>
    >();
    expectTypeOf<ReplayableParamValue>().toEqualTypeOf<
      boolean | number | string | Readonly<Record<string, boolean | number | string>>
    >();
    expectTypeOf<
      Extract<ReplayableParamDefinition, { type: 'object' }>['parameters'][string]['type']
    >().toEqualTypeOf<'number' | 'boolean' | 'text' | 'range' | 'color' | 'select'>();
  });

  it('keeps named contracts equal to the inferred schema inputs and outputs', () => {
    expectTypeOf<
      z.input<typeof paramDefinitionSchema>
    >().toEqualTypeOf<ReplayableParamDefinition>();
    expectTypeOf<
      z.output<typeof paramDefinitionSchema>
    >().toEqualTypeOf<ReplayableParamDefinition>();
    expectTypeOf<
      z.input<typeof scalarParamDefinitionSchema>
    >().toEqualTypeOf<ReplayableScalarParamDefinition>();
    expectTypeOf<
      z.output<typeof scalarParamDefinitionSchema>
    >().toEqualTypeOf<ReplayableScalarParamDefinition>();
    expectTypeOf<ReplayableParamDefinition>().toExtend<ReplayableParamMetadata>();
    expectTypeOf<ReplayableParamMetadata['when']>().toEqualTypeOf<
      ReplayableParamCondition | undefined
    >();
    expectTypeOf<ReplayableSelectParamDefinition['options']>().toEqualTypeOf<
      ReplayableSelectOption[]
    >();
  });

  it('preserves discriminated-union narrowing with named contracts', () => {
    const parsed = paramsSchema.parse({ difficulty: range, theme: select });
    const difficulty = parsed.difficulty;
    const theme = parsed.theme;
    if (difficulty?.type !== 'range' || theme?.type !== 'select') {
      throw new Error('Expected the authored range and select controls.');
    }
    expectTypeOf(difficulty).toEqualTypeOf<ReplayableRangeParamDefinition>();
    expect(difficulty.step).toBe(1);
    // @ts-expect-error A range is not a select.
    expect(difficulty.options).toBeUndefined();
    expectTypeOf(theme).toEqualTypeOf<ReplayableSelectParamDefinition>();
    expect(theme.options[0]?.value).toBe('one');
    // @ts-expect-error A select is not a range.
    expect(theme.step).toBeUndefined();
  });
});

describe('conditional relevance', () => {
  it('accepts absolute root and child references, preserving literal dotted root keys', () => {
    const result = paramsSchema.parse({
      'literal.key': toggle,
      root: { ...text, when: { param: ['tutorial', 'enabled'], equals: true } },
      tutorial: {
        ...group,
        when: { param: 'literal.key', equals: false },
        parameters: {
          ...group.parameters,
          message: { ...text, when: { param: ['tutorial', 'enabled'], equals: true } },
          delay: { ...range, when: { param: 'root', equals: '' } },
        },
      },
    });
    expect(result.tutorial).toHaveProperty('parameters.message.default', 'Hello');
  });

  it.each([
    ['missing', true],
    [['tutorial', 'missing'], true],
    [['enabled', 'child'], true],
    ['tutorial', true],
    ['enabled', 'true'],
    [['tutorial', 'delay'], 0.5],
    ['choice', 'missing'],
    ['color', '#fff'],
    ['constructor', true],
  ])('rejects invalid condition target/value %j = %j', (param, equals) => {
    const result = schema.safeParse({
      params: {
        enabled: toggle,
        tutorial: group,
        choice: select,
        color: { type: 'color', label: 'Color', default: '#ffffff' },
        dependent: { ...text, when: { param, equals } },
      },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path.slice(0, 3)).toEqual(['params', 'dependent', 'when']);
    expect(['param', 'equals']).toContain(result.error?.issues[0]?.path[3]);
  });

  it('rejects root and child self references at their exact paths', () => {
    const root = schema.safeParse({
      params: { enabled: { ...toggle, when: { param: 'enabled', equals: true } } },
    });
    expect(root.error?.issues[0]?.path).toEqual(['params', 'enabled', 'when', 'param']);
    const nested = schema.safeParse({
      params: {
        tutorial: {
          ...group,
          parameters: {
            enabled: { ...toggle, when: { param: ['tutorial', 'enabled'], equals: true } },
          },
        },
      },
    });
    expect(nested.error?.issues[0]?.path).toEqual([
      'params',
      'tutorial',
      'parameters',
      'enabled',
      'when',
      'param',
    ]);
  });

  it.each(
    [['enabled'], ['tutorial', 'enabled', 'extra'], [], { key: 'enabled' }].map((param) => [param]),
  )('rejects malformed paths %j', (param) => {
    expect(
      paramsSchema.safeParse({
        enabled: toggle,
        dependent: { ...text, when: { param, equals: true } },
      }).success,
    ).toBe(false);
  });
});

describe('dimension overrides', () => {
  const definitions = {
    tutorial: group,
    choice: select,
    enabled: toggle,
    number: { type: 'number', label: 'Number', default: 1 },
    color: { type: 'color', label: 'Color', default: '#ffffff' },
    message: text,
  };

  it.each(['networks', 'versions'] as const)(
    'validates partial %s group overrides without dropping falsy values',
    (dimension) => {
      const value = {
        params: definitions,
        [dimension]: {
          preview: {
            params: {
              tutorial: { enabled: false, delay: 0, message: '' },
              number: -3.5,
              message: ' \n ',
              color: '#AaBbCc',
            },
          },
        },
      };
      expect(project.parse(value)[dimension].preview?.params).toEqual({
        tutorial: { enabled: false, delay: 0, message: '' },
        number: -3.5,
        message: ' \n ',
        color: '#AaBbCc',
      });
      expect(
        project.safeParse({
          params: definitions,
          [dimension]: { preview: { params: { tutorial: {} } } },
        }).success,
      ).toBe(true);
    },
  );

  it.each([
    [{ tutorial: { delay: 0.5 } }, ['tutorial', 'delay']],
    [{ tutorial: { unknown: true } }, ['tutorial', 'unknown']],
    [{ tutorial: true }, ['tutorial']],
    [{ unknown: true }, ['unknown']],
    [{ constructor: true }, ['constructor']],
    [{ tutorial: { constructor: true } }, ['tutorial', 'constructor']],
    [{ enabled: 'false' }, ['enabled']],
    [{ choice: 'missing' }, ['choice']],
    [{ color: '#fff' }, ['color']],
    [{ number: '2' }, ['number']],
    [{ message: false }, ['message']],
    [{ message: {} }, ['message']],
  ])('reports exact override paths for %j', (params, suffix) => {
    const result = project.safeParse({
      params: definitions,
      networks: { preview: { params } },
      versions: { default: { params } },
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map(({ path }) => path)).toEqual([
      ['networks', 'preview', 'params', ...suffix],
      ['versions', 'default', 'params', ...suffix],
    ]);
  });

  it.each([null, [], { enabled: null }, { enabled: [] }, { enabled: {} }])(
    'rejects malformed group values %j',
    (value) => {
      expect(
        project.safeParse({
          params: definitions,
          versions: { default: { params: { tutorial: value } } },
        }).success,
      ).toBe(false);
    },
  );

  it.each([NaN, Infinity, -Infinity])('rejects nonfinite overrides %s', (value) => {
    expect(
      project.safeParse({
        params: definitions,
        versions: { default: { params: { number: value } } },
      }).success,
    ).toBe(false);
  });

  it('trims override child names and rejects normalized collisions', () => {
    expect(
      project.parse({
        params: definitions,
        versions: { default: { params: { ' tutorial ': { ' enabled ': false } } } },
      }).versions.default?.params,
    ).toEqual({ tutorial: { enabled: false } });
    expect(
      project.safeParse({
        params: definitions,
        versions: { default: { params: { tutorial: { enabled: true, ' enabled ': false } } } },
      }).success,
    ).toBe(false);
  });
});
