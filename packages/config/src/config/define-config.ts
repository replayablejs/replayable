import type { ReplayableConfig, ReplayableConfigInput } from '#types/config.js';

import { replayableConfigSchema } from './schema.js';

/**
 * Validates an authored Replayable project configuration and applies defaults.
 *
 * @param input - Human-authored Replayable configuration.
 * @returns The validated and normalized project configuration.
 * @throws When a field is missing, unknown, or invalid.
 */
export function defineConfig(input: ReplayableConfigInput): ReplayableConfig {
  return replayableConfigSchema.parse(input);
}
