import type { z } from 'zod';

/** Primitive value accepted by a scalar parameter. */
export type ReplayableScalarParamValue = boolean | number | string;

/** Metadata-only equality condition targeting a root scalar or a grouped child. */
export interface ReplayableParamCondition {
  param: string | [string, string];
  equals: ReplayableScalarParamValue;
}

/** Editor metadata shared by every scalar control and object group. */
export interface ReplayableParamMetadata {
  label: string;
  info?: string | undefined;
  category?: string | undefined;
  when?: ReplayableParamCondition | undefined;
}

/** An unrestricted finite number. */
export interface ReplayableNumberParamDefinition extends ReplayableParamMetadata {
  type: 'number';
  default: number;
}

/** A boolean toggle. */
export interface ReplayableBooleanParamDefinition extends ReplayableParamMetadata {
  type: 'boolean';
  default: boolean;
}

/** Unrestricted text, including empty strings and whitespace. */
export interface ReplayableTextParamDefinition extends ReplayableParamMetadata {
  type: 'text';
  default: string;
}

/** A bounded, step-aligned number. */
export interface ReplayableRangeParamDefinition extends ReplayableParamMetadata {
  type: 'range';
  default: number;
  min: number;
  max: number;
  step: number;
}

/** A six-digit RGB hex color. */
export interface ReplayableColorParamDefinition extends ReplayableParamMetadata {
  type: 'color';
  default: string;
}

/** Display name and exact string value of a select choice. */
export interface ReplayableSelectOption {
  name: string;
  value: string;
}

/** One of a declared set of string choices. */
export interface ReplayableSelectParamDefinition extends ReplayableParamMetadata {
  type: 'select';
  default: string;
  options: ReplayableSelectOption[];
}

/** Controls allowed at the root or inside an object group. */
export type ReplayableScalarParamDefinition =
  | ReplayableNumberParamDefinition
  | ReplayableBooleanParamDefinition
  | ReplayableTextParamDefinition
  | ReplayableRangeParamDefinition
  | ReplayableColorParamDefinition
  | ReplayableSelectParamDefinition;

/** One level of scalar children, with defaults derived from each child. */
export interface ReplayableObjectParamDefinition extends ReplayableParamMetadata {
  type: 'object';
  parameters: Record<string, ReplayableScalarParamDefinition>;
}

/** One scalar control or object group definition. */
export type ReplayableParamDefinition =
  | ReplayableScalarParamDefinition
  | ReplayableObjectParamDefinition;

/** Resolved primitive or one-level group of primitive parameter values. */
export type ReplayableParamValue =
  | ReplayableScalarParamValue
  | Readonly<Record<string, ReplayableScalarParamValue>>;

/** Internal validation and schema-boundary contracts. */
export type ParamDefinition = ReplayableParamDefinition;
export type ScalarParamDefinition = ReplayableScalarParamDefinition;
export type ParamDefinitions = Record<string, ParamDefinition>;
export type NumberParamRange = Pick<ReplayableRangeParamDefinition, 'min' | 'max' | 'step'>;
export type ParamOverrides = Record<
  string,
  ReplayableScalarParamValue | Record<string, ReplayableScalarParamValue>
>;
export type ParamOverrideGroup = Record<string, { params?: ParamOverrides | undefined }>;
export type ValidationContext = z.RefinementCtx;
