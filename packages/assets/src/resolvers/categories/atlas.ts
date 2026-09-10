import { resolve } from 'node:path';
import { dirname } from 'node:path/posix';

import type { AtlasSourceGroup } from '#types/resolution.js';
import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedAtlasAsset } from '#types/resolved-assets.js';
import type { SourceFile } from '#types/source.js';

import {
  isSupportedSourceFile,
  resolveAssetRule,
  resolveBundle,
  stripCategoryDirectory,
} from '../source-resolution.js';

/**
 * Resolves each matched image directory into one logical atlas.
 *
 * For example, `atlases/ui/button.png` and `atlases/ui/icon.png` become one
 * `ui` atlas containing both absolute image paths. The processor later packs
 * that logical atlas into one or more generated sheets.
 */
export function resolveAtlases(context: ResolutionContext): ResolvedAtlasAsset[] {
  const groups = groupAtlasImages(context);

  return groups.map((group) => createResolvedAtlas(context, group));
}

/** Creates the logical atlas value consumed by the texture-packing processor. */
function createResolvedAtlas(
  context: ResolutionContext,
  group: AtlasSourceGroup,
): ResolvedAtlasAsset {
  const category = 'atlases';
  const id = stripCategoryDirectory(group.directory, category);

  return {
    atlas: {
      id,
      images: group.images.map((image) => image.absolutePath),
    },
    bundle: resolveBundle(context.config, group.directory),
    category,
    options: group.rule.options,
    outputDirectory: resolve(context.outputRoot, category, id),
    relativePath: group.directory,
  };
}

/** Groups image directories selected by an atlas rule. */
function groupAtlasImages(context: ResolutionContext): AtlasSourceGroup[] {
  // Atlas packing accepts image files only. Other files may share the source
  // inventory but cannot contribute to an atlas.
  const imageFiles = context.files.filter((file) =>
    isSupportedSourceFile('atlases', file.relativePath),
  );

  // Every source directory represents one logical atlas. Map.groupBy preserves
  // the complete SourceFile values needed by the processor.
  const imagesByDirectory = Map.groupBy(imageFiles, (file) => dirname(file.relativePath));

  // Group creation returns undefined for image directories not selected by an
  // atlas rule, such as sprite or Spine source directories.
  const possibleGroups = [...imagesByDirectory].map(([directory, images]) =>
    createAtlasSourceGroup(context, directory, images),
  );

  // Remove those unrelated directories and order the remaining logical atlases
  // independently of source-file discovery order.
  const atlasGroups = possibleGroups.filter((group) => group !== undefined);

  return atlasGroups.sort((left, right) => left.directory.localeCompare(right.directory));
}

/** Creates one ordered source group when its directory matches an atlas rule. */
function createAtlasSourceGroup(
  context: ResolutionContext,
  directory: string,
  images: readonly SourceFile[],
): AtlasSourceGroup | undefined {
  const rule = resolveAssetRule(context, 'atlases', directory);

  if (rule === undefined) {
    return undefined;
  }

  return {
    directory,
    images: [...images].sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
    rule,
  };
}
