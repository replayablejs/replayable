import type { AssetConfig, AssetConfigInput } from '#types/config.js';

import { assetConfigSchema } from './schema.js';

/**
 * Validates an authored asset configuration and applies schema defaults.
 *
 * Invalid fields or values throw when the configuration module loads. Valid
 * input is returned with trimmed strings, normalized category arrays, and all
 * processor defaults applied.
 *
 * @param config - Author-written configuration to validate and normalize.
 * @returns A validated configuration with schema defaults applied.
 * @throws When any configuration value fails schema validation.
 *
 * @example
 *
 * ```ts
 * import { defineConfig } from '@replayablejs/assets';
 *
 * export default defineConfig({
 *   assets: {
 *     sounds: [{ match: '**' }],
 *   },
 *   emit: { assets: 'src/assets/assets.gen.ts' },
 *   localization: { language: 'en', fallback: 'en' },
 *   outDir: 'assets/out',
 *   sourceDir: 'assets/source',
 * });
 * ```
 */
export function defineConfig(config: AssetConfigInput): AssetConfig {
  return assetConfigSchema.parse(config);
}
