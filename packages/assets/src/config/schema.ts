import { z } from 'zod';

import { atlasRuleSchema } from './schemas/atlas.js';
import { requiredStringSchema } from './schemas/base.js';
import { fontRuleSchema } from './schemas/font.js';
import { imageRuleSchema } from './schemas/image.js';
import { localeRuleSchema } from './schemas/locale.js';
import { shaderRuleSchema } from './schemas/shader.js';
import { soundRuleSchema } from './schemas/sound.js';
import { spineRuleSchema } from './schemas/spine.js';

/** Complete category rule collection with omitted categories normalized to empty arrays. */
const assetsSchema = z.strictObject({
  atlases: z.array(atlasRuleSchema).default([]),
  fonts: z.array(fontRuleSchema).default([]),
  locales: z.array(localeRuleSchema).default([]),
  shaders: z.array(shaderRuleSchema).default([]),
  sounds: z.array(soundRuleSchema).default([]),
  spines: z.array(spineRuleSchema).default([]),
  sprites: z.array(imageRuleSchema).default([]),
  textures: z.array(imageRuleSchema).default([]),
});

/** Fixed build language and the language used for missing translations or assets. */
export const localizationSchema = z.strictObject({
  fallback: requiredStringSchema,
  language: requiredStringSchema,
});

/** Selects assets moved from the always-present primary bundle into secondary. */
const secondaryBundleSchema = z.strictObject({
  exclude: z.array(requiredStringSchema).optional(),
  include: z.array(requiredStringSchema).min(1),
});

/** Optional secondary selection; every unmatched asset remains in primary. */
const bundlesSchema = z
  .strictObject({
    secondary: secondaryBundleSchema.optional(),
  })
  .prefault({});

/** Generated TypeScript module destinations relative to the project root. */
const emitSchema = z.strictObject({
  assets: requiredStringSchema.default('src/assets/assets.gen.ts'),
  registries: requiredStringSchema.optional(),
});

/**
 * Complete runtime schema for `replayable.assets.ts`.
 *
 * `AssetConfigInput` describes author-written configuration where defaulted
 * values may be absent. Parsing produces `AssetConfig`, where defaults are
 * present and strings such as language codes have been trimmed.
 *
 * @remarks Most consumers should call `defineConfig()` instead of invoking
 * this schema directly. The schema is exported for integrations that need Zod
 * parsing, safe parsing, or introspection.
 */
export const assetConfigSchema = z.strictObject({
  sourceDir: requiredStringSchema,
  outDir: requiredStringSchema,
  localization: localizationSchema,
  bundles: bundlesSchema,
  assets: assetsSchema,
  /** Source-relative glob patterns that veto otherwise selected logical assets. */
  exclude: z.array(requiredStringSchema).default([]),
  emit: emitSchema,
});
