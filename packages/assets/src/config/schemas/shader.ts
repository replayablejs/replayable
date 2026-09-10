import { assetRuleSchema } from './base.js';

/**
 * Rule for directories containing paired vertex and fragment shader sources.
 *
 * Shader sources are copied unchanged and do not accept processor options. The
 * resolver only requires both `vert.glsl` and `frag.glsl`; Replayable does not
 * validate GLSL syntax, versions, entry points, or stage compatibility.
 */
export const shaderRuleSchema = assetRuleSchema;
