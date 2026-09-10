import type {
  ParamDefinition,
  ParamDefinitions,
  ParamOverrideGroup,
  NumberParamRange,
  ValidationContext,
} from '#types/params.js';

/** Validates catalog values and conditions after schema parsing. */
export function validateParamDefinitions(
  params: ParamDefinitions,
  context: ValidationContext,
): void {
  for (const [name, definition] of Object.entries(params)) {
    validateParamDefinition(name, definition, params, context);
  }
}

/** Validates constraints and dependency references within the parameter catalog. */
function validateParamDefinition(
  name: string,
  definition: ParamDefinition,
  params: ParamDefinitions,
  context: ValidationContext,
): void {
  switch (definition.type) {
    case 'boolean':
      break;
    case 'number':
      validateNumberParam(name, definition, context);
      break;
    case 'string':
      validateStringParam(name, definition, context);
      break;
  }

  validateParamCondition(name, definition, params, context);
}

/** Validates one number parameter's range and default value. */
function validateNumberParam(
  name: string,
  definition: Extract<ParamDefinition, { type: 'number' }>,
  context: ValidationContext,
): void {
  const { max, min } = definition.range;

  if (min > max) {
    addParamIssue(context, name, ['range'], 'The minimum cannot exceed the maximum.');
  } else if (!isStepAligned(max, definition.range)) {
    addParamIssue(
      context,
      name,
      ['range', 'step'],
      'The maximum must be reachable from the minimum using the configured step.',
    );
  } else if (definition.default < min || definition.default > max) {
    addParamIssue(context, name, ['default'], 'The default must be within its configured range.');
  } else if (!isStepAligned(definition.default, definition.range)) {
    addParamIssue(
      context,
      name,
      ['default'],
      'The default must align with the configured range step.',
    );
  }
}

/** Validates one string parameter's options and default value. */
function validateStringParam(
  name: string,
  definition: Extract<ParamDefinition, { type: 'string' }>,
  context: ValidationContext,
): void {
  if (new Set(definition.options).size !== definition.options.length) {
    addParamIssue(context, name, ['options'], 'Parameter options must be unique.');
  }

  if (!definition.options.includes(definition.default)) {
    addParamIssue(context, name, ['default'], 'The default must appear in its configured options.');
  }
}

/** Validates one parameter's optional condition against the complete catalog. */
function validateParamCondition(
  name: string,
  definition: ParamDefinition,
  params: ParamDefinitions,
  context: ValidationContext,
): void {
  const condition = definition.when;

  if (condition === undefined) {
    return;
  }

  const referencedParam = params[condition.param];

  if (referencedParam === undefined) {
    addParamIssue(
      context,
      name,
      ['when', 'param'],
      'The condition references a parameter that does not exist.',
    );

    return;
  }

  if (condition.param === name) {
    addParamIssue(context, name, ['when', 'param'], 'A parameter cannot condition itself.');
  }

  if (!isAllowedParamValue(referencedParam, condition.equals)) {
    addParamIssue(
      context,
      name,
      ['when', 'equals'],
      'The condition value must be allowed by the referenced parameter.',
    );
  }
}

/** Ensures every dimension override names an existing parameter and supplies an allowed value. */
export function validateParamOverrides(
  groupName: 'networks' | 'versions',
  overrides: ParamOverrideGroup,
  params: ParamDefinitions,
  context: ValidationContext,
): void {
  for (const [dimensionName, dimensionOverride] of Object.entries(overrides)) {
    for (const [paramName, value] of Object.entries(dimensionOverride.params ?? {})) {
      const definition = params[paramName];

      if (definition === undefined) {
        context.addIssue({
          code: 'custom',
          message: 'The overridden parameter does not exist.',
          path: [groupName, dimensionName, 'params', paramName],
        });

        continue;
      }

      if (!isAllowedParamValue(definition, value)) {
        context.addIssue({
          code: 'custom',
          message: 'The override does not satisfy the parameter definition.',
          path: [groupName, dimensionName, 'params', paramName],
        });
      }
    }
  }
}

/** Checks an override against the parameter's finite set of allowed values. */
function isAllowedParamValue(definition: ParamDefinition, value: unknown): boolean {
  let allowed: boolean;

  switch (definition.type) {
    case 'boolean':
      allowed = typeof value === 'boolean';
      break;
    case 'number':
      allowed = typeof value === 'number' && isAllowedNumberValue(value, definition.range);
      break;
    case 'string':
      allowed = typeof value === 'string' && definition.options.includes(value);
      break;
  }

  return allowed;
}

/** Checks both numeric bounds and membership in the range's discrete step sequence. */
function isAllowedNumberValue(value: number, range: NumberParamRange): boolean {
  return value >= range.min && value <= range.max && isStepAligned(value, range);
}

/** Tolerates the small rounding error produced by fractional JavaScript arithmetic. */
function isStepAligned(value: number, range: NumberParamRange): boolean {
  const stepsFromMinimum = (value - range.min) / range.step;

  return Math.abs(stepsFromMinimum - Math.round(stepsFromMinimum)) < 1e-9;
}

/** Adds one issue at a parameter-relative path. */
function addParamIssue(
  context: ValidationContext,
  name: string,
  path: readonly PropertyKey[],
  message: string,
): void {
  context.addIssue({
    code: 'custom',
    message,
    path: [name, ...path],
  });
}
