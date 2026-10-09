import type {
  ParamDefinition,
  ParamDefinitions,
  ParamOverrideGroup,
  ScalarParamDefinition,
  NumberParamRange,
  ValidationContext,
} from '#types/params.js';

import { colorParamValueSchema } from '../schemas/param-values.js';

/** Validates catalog values and absolute condition references after structural parsing. */
export function validateParamDefinitions(
  params: ParamDefinitions,
  context: ValidationContext,
): void {
  for (const [name, definition] of Object.entries(params)) {
    validateParamCondition(definition, params, [name], [name], context);
    if (definition.type === 'object') {
      for (const [child, scalar] of Object.entries(definition.parameters)) {
        const path = [name, 'parameters', child];
        validateScalarDefinition(scalar, path, context);
        validateParamCondition(scalar, params, [name, child], path, context);
      }
    } else {
      validateScalarDefinition(definition, [name], context);
    }
  }
}

/** Checks relationships that cannot be expressed by individual field schemas. */
function validateScalarDefinition(
  definition: ScalarParamDefinition,
  path: readonly PropertyKey[],
  context: ValidationContext,
): void {
  if (definition.type === 'range') {
    const { min, max, default: value } = definition;
    if (min > max) {
      addIssue(context, [...path, 'min'], 'The minimum cannot exceed the maximum.');
    } else if (!isStepAligned(max, definition)) {
      addIssue(
        context,
        [...path, 'step'],
        'The maximum must be reachable from the minimum using the configured step.',
      );
    } else if (value < min || value > max) {
      addIssue(context, [...path, 'default'], 'The default must be within its configured range.');
    } else if (!isStepAligned(value, definition)) {
      addIssue(
        context,
        [...path, 'default'],
        'The default must align with the configured range step.',
      );
    }
  } else if (definition.type === 'select') {
    const values = definition.options.map(({ value }) => value);
    if (new Set(values).size !== values.length) {
      addIssue(context, [...path, 'options'], 'Option values must be unique.');
    }
    if (!values.includes(definition.default)) {
      addIssue(context, [...path, 'default'], 'The default must match an option value.');
    }
  }
}

/** Conditions reference a root scalar by name or a grouped scalar by an absolute tuple. */
function validateParamCondition(
  definition: ParamDefinition,
  params: ParamDefinitions,
  valuePath: readonly string[],
  definitionPath: readonly PropertyKey[],
  context: ValidationContext,
): void {
  const condition = definition.when;
  if (condition === undefined) {
    return;
  }

  const targetPath = typeof condition.param === 'string' ? [condition.param] : condition.param;
  if (
    targetPath.length === valuePath.length &&
    targetPath.every((part, index) => part === valuePath[index])
  ) {
    addIssue(context, [...definitionPath, 'when', 'param'], 'A parameter cannot condition itself.');
    return;
  }

  const root = targetPath[0]!;
  let target = Object.hasOwn(params, root) ? params[root] : undefined;
  const child = targetPath[1];
  if (child !== undefined) {
    target =
      target?.type === 'object' && Object.hasOwn(target.parameters, child)
        ? target.parameters[child]
        : undefined;
  }
  if (target === undefined) {
    addIssue(
      context,
      [...definitionPath, 'when', 'param'],
      'The condition references a parameter that does not exist.',
    );
  } else if (target.type === 'object') {
    addIssue(
      context,
      [...definitionPath, 'when', 'param'],
      'A condition must reference a scalar parameter.',
    );
  } else if (!isAllowedScalarValue(target, condition.equals)) {
    addIssue(
      context,
      [...definitionPath, 'when', 'equals'],
      'The condition value must be allowed by the referenced parameter.',
    );
  }
}

/** Checks partial dimension overrides against the same leaf constraints as their defaults. */
export function validateParamOverrides(
  groupName: 'networks' | 'versions',
  overrides: ParamOverrideGroup,
  params: ParamDefinitions,
  context: ValidationContext,
): void {
  for (const [dimension, override] of Object.entries(overrides)) {
    for (const [name, value] of Object.entries(override.params ?? {})) {
      const path = [groupName, dimension, 'params', name];
      const definition = Object.hasOwn(params, name) ? params[name] : undefined;
      if (definition === undefined) {
        addIssue(context, path, 'The overridden parameter does not exist.');
      } else if (definition.type === 'object') {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          addIssue(context, path, 'An object parameter requires a partial object of child values.');
          continue;
        }
        for (const [child, childValue] of Object.entries(value)) {
          const scalar = Object.hasOwn(definition.parameters, child)
            ? definition.parameters[child]
            : undefined;
          if (scalar === undefined) {
            addIssue(context, [...path, child], 'The overridden child parameter does not exist.');
          } else if (!isAllowedScalarValue(scalar, childValue)) {
            addIssue(
              context,
              [...path, child],
              'The override does not satisfy the parameter definition.',
            );
          }
        }
      } else if (!isAllowedScalarValue(definition, value)) {
        addIssue(context, path, 'The override does not satisfy the parameter definition.');
      }
    }
  }
}

/** No value coercion: free text and select values keep their exact authored spelling. */
function isAllowedScalarValue(definition: ScalarParamDefinition, value: unknown): boolean {
  let allowed: boolean;
  switch (definition.type) {
    case 'boolean':
      allowed = typeof value === 'boolean';
      break;
    case 'number':
      allowed = typeof value === 'number' && Number.isFinite(value);
      break;
    case 'text':
      allowed = typeof value === 'string';
      break;
    case 'color':
      allowed = colorParamValueSchema.safeParse(value).success;
      break;
    case 'select':
      allowed = definition.options.some((option) => option.value === value);
      break;
    case 'range':
      allowed =
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= definition.min &&
        value <= definition.max &&
        isStepAligned(value, definition);
      break;
  }
  return allowed;
}

/** Tolerates the small rounding error produced by fractional JavaScript arithmetic. */
function isStepAligned(value: number, range: NumberParamRange): boolean {
  const stepsFromMinimum = (value - range.min) / range.step;
  return Math.abs(stepsFromMinimum - Math.round(stepsFromMinimum)) < 1e-9;
}

/** Paths are relative to the schema refinement that owns this validation. */
function addIssue(context: ValidationContext, path: readonly PropertyKey[], message: string): void {
  context.addIssue({ code: 'custom', message, path: [...path] });
}
