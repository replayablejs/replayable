import { z } from 'zod';

/** Trimmed configuration string that must contain at least one character. */
export const requiredStringSchema = z.string().trim().min(1);

/**
 * Strict source-selection fields shared by every asset rule.
 *
 * Category schemas extend this base when they accept processor options. A
 * category without options can use it directly, causing an authored `options`
 * field to be rejected rather than accepted as unknown data.
 */
export const assetRuleSchema = z.strictObject({
  /**
   * Category-relative source-file glob or grouped-asset directory.
   *
   * File categories such as sprites and sounds match paths below their category
   * directory. Grouped categories match the directory that represents the
   * complete asset, so a Spine export in `spines/raptor` uses `raptor`, not
   * `raptor/**`. Omitted matches default to `**` and select every asset.
   */
  match: requiredStringSchema.default('**'),
  /** Optional glob patterns removed from the matched sources. */
  exclude: z.array(requiredStringSchema).optional(),
});
