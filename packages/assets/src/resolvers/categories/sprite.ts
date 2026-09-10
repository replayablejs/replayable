import { resolve } from 'node:path';
import { basename, dirname } from 'node:path/posix';

import { removeExtension } from '#pipeline/source-path.js';
import type { LocalizationConfig } from '#types/config.js';
import type { SpriteVariant, SpriteVariantGroup, ParsedSpritePath } from '#types/resolution.js';
import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedImageAsset } from '#types/resolved-assets.js';
import type { SourceFile } from '#types/source.js';

import {
  isSupportedSourceFile,
  resolveAssetRule,
  resolveBundle,
  stripCategoryDirectory,
} from '../source-resolution.js';

/**
 * Selects exactly one sprite source for the configured build language.
 *
 * Locale suffixes are removed from the logical asset path before variants are
 * grouped. For example, `logo.hy.png`, `logo.en.png`, and `logo.png` all map to
 * `logo.png`. Selection prefers the requested language, then the configured
 * fallback language, then the unlocalized file.
 */
export function resolveSprites(context: ResolutionContext): ResolvedImageAsset[] {
  const groups = groupSpriteVariants(context);

  return groups.map((group) => {
    const selectedVariant = selectSpriteVariant(group, context.config.localization);

    return createResolvedSprite(context, group, selectedVariant);
  });
}

/**
 * Groups matched physical images by the canonical path shared by their locale variants.
 *
 * For example, this source inventory:
 *
 * ```text
 * sprites/background.png
 * sprites/logo.hy.png
 * sprites/logo.en.png
 * sprites/logo.png
 * textures/normal.png
 * sprites/README.md
 * ```
 *
 * produces the equivalent of:
 *
 * ```ts
 * [
 *   {
 *     canonicalPath: 'sprites/background.png',
 *     variants: ['sprites/background.png'],
 *   },
 *   {
 *     canonicalPath: 'sprites/logo.png',
 *     variants: [
 *       'sprites/logo.en.png',
 *       'sprites/logo.hy.png',
 *       'sprites/logo.png',
 *     ],
 *   },
 * ]
 * ```
 *
 * `textures/normal.png` is discarded when no sprite rule selects it, and the
 * non-image README is ignored before rule matching. Both groups and variants
 * use stable path ordering. This function only forms the groups;
 * `selectSpriteVariant` later chooses the language-specific source included in
 * the fixed-language build.
 */
function groupSpriteVariants(context: ResolutionContext): SpriteVariantGroup[] {
  // Sprite rules can use broad directory globs, but only supported image files
  // can become sprite sources.
  const imageFiles = context.files.filter((file) =>
    isSupportedSourceFile('sprites', file.relativePath),
  );

  // Variant matching returns undefined for images outside the configured
  // sprite rules and resolves locale metadata for every selected source.
  const possibleVariants = imageFiles.map((file) => matchSpriteVariant(context, file));
  const variants = possibleVariants.filter((variant) => variant !== undefined);

  // Localized physical files share one canonical path and therefore one
  // generated runtime asset.
  const variantsByCanonicalPath = Map.groupBy(variants, (variant) => variant.canonicalPath);

  return [...variantsByCanonicalPath]
    .map(([canonicalPath, groupedVariants]) => ({
      canonicalPath,
      variants: [...groupedVariants].sort((left, right) =>
        left.relativePath.localeCompare(right.relativePath),
      ),
    }))
    .sort((left, right) => left.canonicalPath.localeCompare(right.canonicalPath));
}

/**
 * Attempts to classify one discovered image as a configured sprite variant.
 *
 * The shared source inventory contains images belonging to atlases, Spine
 * exports, textures, and sprites. An image becomes a sprite variant only when
 * at least one sprite rule matches its physical source path. If several rules
 * match, `resolveAssetRule` supplies options from the final matching rule unless
 * the logical sprite is excluded.
 *
 * Locale parsing then separates physical identity from logical identity. For
 * example, `sprites/logo.hy.png` retains that physical `relativePath`, but its
 * `canonicalPath` becomes `sprites/logo.png` and its locale becomes `hy`.
 * Returning `undefined` tells the grouping stage to discard an image that no
 * sprite rule selected.
 */
function matchSpriteVariant(
  context: ResolutionContext,
  file: SourceFile,
): SpriteVariant | undefined {
  // The canonical path removes locale identity, allowing one exclusion to
  // veto every physical language variant belonging to the logical sprite.
  const parsedPath = parseSpritePath(file.relativePath);

  // Rules match the physical filename so localized variants may receive
  // different processing options when explicitly configured.
  const rule = resolveAssetRule(context, 'sprites', file.relativePath, parsedPath.canonicalPath);

  if (rule === undefined) {
    return undefined;
  }

  return {
    ...file,
    canonicalPath: parsedPath.canonicalPath,
    locale: parsedPath.locale,
    options: rule.options,
  };
}

/**
 * Selects the one physical variant included in the fixed-language build.
 *
 * Selection follows the configured priority exactly:
 *
 * 1. A variant matching `localization.language`.
 * 2. A variant matching `localization.fallback`.
 * 3. An unlocalized variant without a locale suffix.
 *
 * Continuing the `groupSpriteVariants` example, its `sprites/logo.png` group
 * contains Armenian, English, and unlocalized variants. Given:
 *
 * ```ts
 * { language: 'hy', fallback: 'en' }
 * ```
 *
 * this function returns the equivalent of:
 *
 * ```ts
 * {
 *   canonicalPath: 'sprites/logo.png',
 *   relativePath: 'sprites/logo.hy.png',
 *   locale: 'hy',
 *   // absolutePath and processing options belong to this Armenian source.
 * }
 * ```
 *
 * If `logo.hy.png` is absent, the same group returns `logo.en.png`. If both
 * localized variants are absent, it returns `logo.png`. A group containing
 * only `logo.fr.png` fails because Replayable must not silently include an
 * unrelated language.
 *
 * The returned variant retains the processing options and physical path of
 * the rule that selected that specific localized source.
 */
function selectSpriteVariant(
  group: SpriteVariantGroup,
  localization: LocalizationConfig,
): SpriteVariant {
  const languageVariant = group.variants.find(
    (variant) => variant.locale === localization.language,
  );

  if (languageVariant !== undefined) {
    return languageVariant;
  }

  const fallbackVariant = group.variants.find(
    (variant) => variant.locale === localization.fallback,
  );

  if (fallbackVariant !== undefined) {
    return fallbackVariant;
  }

  const unlocalizedVariant = group.variants.find((variant) => variant.locale === undefined);

  if (unlocalizedVariant !== undefined) {
    return unlocalizedVariant;
  }

  throw new Error(
    `Localized sprite ${group.canonicalPath} has no ${localization.language}, ${localization.fallback}, or unlocalized variant.`,
  );
}

/** Creates the single resolved sprite selected for the fixed-language build. */
function createResolvedSprite(
  context: ResolutionContext,
  group: SpriteVariantGroup,
  selectedVariant: SpriteVariant,
): ResolvedImageAsset {
  const category = 'sprites';
  const categoryPath = stripCategoryDirectory(group.canonicalPath, category);

  return {
    absolutePath: selectedVariant.absolutePath,
    bundle: resolveBundle(context.config, selectedVariant.relativePath),
    category,
    options: selectedVariant.options,
    outputBasePath: resolve(context.outputRoot, category, removeExtension(categoryPath)),
    relativePath: group.canonicalPath,
  };
}

/**
 * Removes an optional locale suffix while preserving the physical extension.
 *
 * `sprites/logo.hy.png` becomes `{ canonicalPath: 'sprites/logo.png', locale:
 * 'hy' }`, while `sprites/logo.png` keeps its path and has no locale. The
 * canonical path allows every localized source to join the same variant group.
 */
function parseSpritePath(path: string): ParsedSpritePath {
  const fileName = basename(path);

  // Capture the base name, supported locale suffix, and final extension.
  const match = /^(.*)\.([a-z]{2}(?:-[A-Z]{2})?)\.([^.]+)$/.exec(fileName);

  // Files without a locale suffix keep their original logical path and serve
  // as the final fallback during locale selection.
  if (match === null) {
    return { canonicalPath: path, locale: undefined };
  }

  const directory = dirname(path);
  const canonicalName = `${match[1]}.${match[3]}`;

  return {
    canonicalPath: directory === '.' ? canonicalName : `${directory}/${canonicalName}`,
    locale: match[2],
  };
}
