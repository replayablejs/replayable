import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { basename, dirname, extname } from 'node:path/posix';

import { parseSpineAtlasPageNames } from '#adapters/spine-atlas-parser.js';
import type { SpineSkeletonSource, SpineSourceGroup } from '#types/resolution.js';
import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedSpineAsset } from '#types/resolved-assets.js';
import type { SourceFile } from '#types/source.js';

import {
  isImageFile,
  isSpineAtlasFile,
  isSpineSkeletonFile,
  isSupportedSourceFile,
  resolveAssetRule,
  resolveBundle,
  stripCategoryDirectory,
} from '../source-resolution.js';

/**
 * Resolves each matched Spine directory into one complete build instruction.
 *
 * Source grouping validates the skeleton and atlas structure first. Atlas page
 * declarations are then read concurrently because each Spine export is
 * independent, while `Promise.all` preserves the stable group order.
 */
export async function resolveSpines(context: ResolutionContext): Promise<ResolvedSpineAsset[]> {
  const groups = groupSpineSources(context);

  return Promise.all(groups.map((group) => createResolvedSpine(context, group)));
}

/** Finds complete Spine directories selected by the configured rules. */
function groupSpineSources(context: ResolutionContext): SpineSourceGroup[] {
  // Ignore unrelated export files before they can form candidate directories.
  const spineFiles = context.files.filter((file) =>
    isSupportedSourceFile('spines', file.relativePath),
  );

  // One directory owns the skeleton, atlas description, and every texture
  // page of one logical Spine asset.
  const filesByDirectory = Map.groupBy(spineFiles, (file) => dirname(file.relativePath));

  // Group creation returns undefined for directories outside the configured
  // Spine rules and validates every directory selected as a Spine asset.
  const possibleGroups = [...filesByDirectory].map(([directory, directoryFiles]) =>
    createSpineSourceGroup(context, directory, directoryFiles),
  );
  const spineGroups = possibleGroups.filter((group) => group !== undefined);

  // Stable directory ordering keeps output independent of discovery order.
  return spineGroups.sort((left, right) => left.directory.localeCompare(right.directory));
}

/** Creates one complete source group when its directory matches a Spine rule. */
function createSpineSourceGroup(
  context: ResolutionContext,
  directory: string,
  files: readonly SourceFile[],
): SpineSourceGroup | undefined {
  const rule = resolveAssetRule(context, 'spines', directory);

  if (rule === undefined) {
    return undefined;
  }

  const skeleton = selectOnlySkeleton(directory, files);
  const atlas = selectOnlyAtlas(directory, files);

  return {
    atlas,
    directory,
    images: files.filter((file) => isImageFile(file.relativePath)),
    options: rule.options,
    skeleton,
  };
}

/** Reads one Spine atlas and constructs its processor-ready build instruction. */
async function createResolvedSpine(
  context: ResolutionContext,
  group: SpineSourceGroup,
): Promise<ResolvedSpineAsset> {
  const atlasSource = await readFile(group.atlas.absolutePath, 'utf8');
  const pageNames = parseSpineAtlasPageNames(atlasSource, group.atlas.relativePath);

  if (pageNames.length === 0) {
    throw new Error(`Spine atlas ${group.atlas.relativePath} contains no texture pages.`);
  }

  const pageImages = resolveTexturePages(group.atlas, pageNames, group.images);
  const id = stripCategoryDirectory(group.directory, 'spines');

  return {
    bundle: resolveBundle(context.config, group.directory),
    category: 'spines',
    options: group.options,
    outputDirectory: resolve(context.outputRoot, 'spines', id),
    spine: {
      atlas: group.atlas.absolutePath,
      id,
      images: pageImages.map((image) => image.absolutePath),
      skeleton: {
        format: group.skeleton.format,
        path: group.skeleton.absolutePath,
      },
    },
    relativePath: group.directory,
  };
}

/** Requires exactly one JSON or SKEL skeleton in a selected Spine directory. */
function selectOnlySkeleton(directory: string, files: readonly SourceFile[]): SpineSkeletonSource {
  const skeletons = files.filter((file) => isSpineSkeletonFile(file.relativePath));
  const skeleton = skeletons[0];

  if (skeleton === undefined || skeletons.length > 1) {
    throw new Error(
      `Spine ${directory} must contain exactly one matched JSON or SKEL skeleton; found ${skeletons.length}.`,
    );
  }

  return {
    ...skeleton,
    format: resolveSpineSkeletonFormat(skeleton.relativePath),
  };
}

/** Converts a supported skeleton extension into its runtime loading format. */
function resolveSpineSkeletonFormat(relativePath: string): 'json' | 'skel' {
  switch (extname(relativePath).toLowerCase()) {
    case '.json':
      return 'json';
    case '.skel':
      return 'skel';
    default:
      throw new Error(`Unsupported Spine skeleton: ${relativePath}`);
  }
}

/** Requires exactly one atlas description in a selected Spine directory. */
function selectOnlyAtlas(directory: string, files: readonly SourceFile[]): SourceFile {
  const atlases = files.filter((file) => isSpineAtlasFile(file.relativePath));
  const atlas = atlases[0];

  if (atlas === undefined || atlases.length > 1) {
    throw new Error(
      `Spine ${directory} must contain exactly one .atlas file; found ${atlases.length}.`,
    );
  }

  return atlas;
}

/** Resolves official atlas page declarations to sibling source images in order. */
function resolveTexturePages(
  atlas: SourceFile,
  pageNames: readonly string[],
  images: readonly SourceFile[],
): SourceFile[] {
  // Index sibling image files by the filename used in Spine atlas page
  // declarations. The source layout requires every texture to be a sibling of
  // the skeleton and atlas description.
  const imageFilesByName = new Map(images.map((image) => [basename(image.relativePath), image]));
  const resolvedImages: SourceFile[] = [];
  const resolvedNames = new Set<string>();

  // Preserve the authored page order because the generated runtime image array
  // must use exactly the same positions as the Spine atlas.
  for (const pageName of pageNames) {
    const imageName = basename(pageName);

    // Two atlas declarations must not resolve to the same sibling image.
    if (resolvedNames.has(imageName)) {
      throw new Error(`Spine atlas ${atlas.relativePath} declares duplicate page ${pageName}.`);
    }

    const image = imageFilesByName.get(imageName);

    // Every declared page must exist in the selected Spine source directory.
    if (image === undefined) {
      throw new Error(`Spine atlas ${atlas.relativePath} references missing page ${pageName}.`);
    }

    resolvedNames.add(imageName);
    resolvedImages.push(image);
  }

  return resolvedImages;
}
