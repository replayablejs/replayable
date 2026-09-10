import { assetRuleSchema } from './base.js';
import { imageOptionsSchema } from './image.js';

/** Image processing options applied independently to every Spine texture page. */
export const spineOptionsSchema = imageOptionsSchema;

/**
 * Rule for directories containing a Spine skeleton, atlas, and texture pages.
 *
 * Image options apply independently to every texture page. Skeleton and atlas
 * files retain their source formats. The configured scale is also emitted as
 * runtime metadata so the application can align skeleton coordinates with
 * resized textures.
 */
export const spineRuleSchema = assetRuleSchema.extend({
  options: spineOptionsSchema.prefault({}),
});
