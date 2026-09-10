import { matchesGlob } from 'node:path';

import type { AssetSelectionRule } from '#types/asset-rules.js';
import type { AssetBundleName } from '#types/bundles.js';
import type { AssetCategory } from '#types/categories.js';
import type { AssetConfig } from '#types/config.js';
import type { SecondaryBundleConfig, AssetRule } from '#types/resolution.js';
import type { ResolutionContext } from '#types/resolution.js';

/**
 * Resolves the final configuration rule that claims one logical asset.
 *
 * Category ownership is checked first, so asset rules receive the physical
 * path relative to that directory. Final source-relative exclusions then veto
 * selection before the last matching rule supplies processor options. Most
 * assets use the same physical and logical path; localized sprites pass their
 * canonical path separately so every language variant shares one exclusion
 * identity.
 */
export function resolveAssetRule<Category extends AssetCategory>(
  context: ResolutionContext,
  category: Category,
  sourcePath: string,
  logicalPath = sourcePath,
): AssetRule<Category> | undefined {
  const categoryPath = getCategoryPath(sourcePath, category);

  if (categoryPath === undefined) {
    return undefined;
  }

  if (matchesAnyGlob(logicalPath, context.config.exclude)) {
    return undefined;
  }

  return context.config.assets[category].findLast((rule) => matchesRule(rule, categoryPath));
}

/**
 * Chooses the runtime bundle that will contain one resolved asset.
 *
 * Every asset belongs to `primary` unless it matches the optional
 * `bundles.secondary` selection. This fixed contract mirrors playable loading:
 * primary assets are available at startup, while secondary assets may be loaded
 * later.
 *
 * For example, given:
 *
 * ```ts
 * bundles: {
 *   secondary: {
 *     include: ['sprites/deferred/**', 'sounds/deferred/**'],
 *     exclude: ['sprites/deferred/debug/**'],
 *   },
 * }
 * ```
 *
 * `sprites/player.png` and `sprites/deferred/debug/grid.png` resolve to
 * `primary`; `sprites/deferred/logo.png` resolves to `secondary`.
 */
export function resolveBundle(config: AssetConfig, relativePath: string): AssetBundleName {
  const secondary = config.bundles.secondary;

  if (secondary !== undefined && matchesSecondaryBundle(secondary, relativePath)) {
    return 'secondary';
  }

  return 'primary';
}

/**
 * Removes the category directory from a path already claimed by that category.
 *
 * For example, `sprites/ui/button.png` becomes `ui/button.png` for the
 * `sprites` category. `resolveAssetRule` establishes this ownership before a
 * resolver constructs runtime identity or output paths.
 */
export function stripCategoryDirectory(path: string, category: AssetCategory): string {
  return path.slice(category.length + 1);
}

/**
 * Returns whether a source file uses a format supported by one asset category.
 *
 * Configuration rules select logical assets, not file encodings. Keeping the
 * format contract here lets a general sound rule omit `match` while accepting
 * authored audio and ignoring unrelated files in the same directory.
 */
export function isSupportedSourceFile(category: AssetCategory, path: string): boolean {
  switch (category) {
    case 'atlases':
    case 'sprites':
    case 'textures':
      return isImageFile(path);
    case 'fonts':
      return /\.(?:otf|ttf|woff2?)$/i.test(path);
    case 'locales':
      return /\.jsonc?$/i.test(path);
    case 'shaders':
      return isShaderSourceFile(path);
    case 'sounds':
      return /\.(?:m4a|mp3|ogg|wav)$/i.test(path);
    case 'spines':
      return isImageFile(path) || isSpineAtlasFile(path) || isSpineSkeletonFile(path);
    default:
      return unsupportedSourceCategory(category);
  }
}

/** Returns a path relative to its category directory, or undefined when outside it. */
function getCategoryPath(path: string, category: AssetCategory): string | undefined {
  const categoryDirectory = `${category}/`;

  return path.startsWith(categoryDirectory) ? path.slice(categoryDirectory.length) : undefined;
}

export function isImageFile(path: string): boolean {
  return /\.(?:avif|jpe?g|png|webp)$/i.test(path);
}

export function isShaderSourceFile(path: string): boolean {
  return /\.glsl$/i.test(path);
}

export function isSpineAtlasFile(path: string): boolean {
  return /\.atlas$/i.test(path);
}

export function isSpineSkeletonFile(path: string): boolean {
  return /\.(?:json|skel)$/i.test(path);
}

function matchesRule(rule: AssetSelectionRule, relativePath: string): boolean {
  if (!matchesGlob(relativePath, rule.match)) {
    return false;
  }

  if (rule.exclude !== undefined && matchesAnyGlob(relativePath, rule.exclude)) {
    return false;
  }

  return true;
}

/** Keeps source-format handling exhaustive when a new asset category is added. */
function unsupportedSourceCategory(category: never): never {
  throw new Error(`Unsupported source asset category: ${String(category)}.`);
}

/**
 * Determines whether the secondary selection claims a source-relative path.
 *
 * Patterns in `include` use OR semantics: matching any one of them selects the
 * path as a candidate. Patterns in `exclude` are vetoes: matching any one of
 * them rejects the candidate even when an `include` pattern matched.
 *
 * For example:
 *
 * ```ts
 * {
 *   include: ['sprites/deferred/**', 'sounds/deferred/**'],
 *   exclude: ['sprites/deferred/debug/**'],
 * }
 * ```
 *
 * accepts `sprites/deferred/logo.png` and `sounds/deferred/music.wav`, but
 * rejects both `sprites/player.png` (not included) and
 * `sprites/deferred/debug/grid.png`
 * (explicitly excluded).
 */
function matchesSecondaryBundle(secondary: SecondaryBundleConfig, relativePath: string): boolean {
  // Secondary cannot claim the asset unless at least one include pattern matches.
  if (!matchesAnyGlob(relativePath, secondary.include)) {
    return false;
  }

  // Exclusions take precedence over inclusion. An absent exclude list means
  // the successful include match is not vetoed.
  if (secondary.exclude !== undefined && matchesAnyGlob(relativePath, secondary.exclude)) {
    return false;
  }

  // The path matched an include pattern and no exclusion kept it in primary.
  return true;
}

/** Returns whether a path matches at least one glob in a pattern collection. */
function matchesAnyGlob(relativePath: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => matchesGlob(relativePath, pattern));
}
