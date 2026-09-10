import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { readSpineSkeletonMetadata } from '#adapters/spine-skeleton-parser.js';
import type { ImageOptions } from '#types/asset-options.js';
import type {
  GeneratedFile,
  GeneratedImageFormat,
  ProcessedSpineAsset,
} from '#types/processed-assets.js';
import type { ResolvedSpineAsset, ResolvedSpineSkeleton } from '#types/resolved-assets.js';

import { writeSmallestImage } from '../image-encoder.js';

/**
 * Emits one self-contained Spine runtime asset.
 *
 * JSON skeletons are minified, binary skeletons and atlas descriptions are
 * copied byte-for-byte, and every texture page is optimized independently. A
 * two-page Spine therefore emits four files: skeleton, atlas, and one selected
 * image for each page.
 *
 * For example, these resolved source files:
 *
 * ```text
 * spines/hero/hero.json
 * spines/hero/hero.atlas  -> declares body.png, then effects.png
 * spines/hero/body.png
 * spines/hero/effects.png
 * ```
 *
 * may produce:
 *
 * ```text
 * spines/hero/skeleton.json
 * spines/hero/atlas.atlas
 * spines/hero/images/page0.webp
 * spines/hero/images/page1.avif
 * ```
 *
 * The returned processed asset contains the skeleton file, atlas file, and
 * `[page0, page1]` texture array. It also retains animation and skin names while
 * the authored skeleton is available, allowing registry emission to remain a
 * synchronous serialization step. Page order remains identical to the atlas
 * declaration even when different encodings win for different pages. The
 * returned one-item array follows the common processor contract: one resolved
 * Spine asset produces one complete processed asset.
 */
export async function processSpine(asset: ResolvedSpineAsset): Promise<ProcessedSpineAsset[]> {
  const spine = asset.spine;
  const metadata = await readSpineSkeletonMetadata(spine.skeleton, spine.atlas);

  await mkdir(asset.outputDirectory, { recursive: true });

  const skeletonFile = await writeSpineSkeleton(spine.skeleton, asset.outputDirectory);
  const atlasFile = await copySpineAtlas(spine.atlas, asset.outputDirectory);
  const texturePages = await writeSpineTexturePages(
    spine.images,
    asset.outputDirectory,
    asset.options,
  );

  return [
    {
      bundle: asset.bundle,
      category: 'spines',
      files: {
        atlas: atlasFile,
        images: texturePages,
        skeleton: skeletonFile,
      },
      id: spine.id,
      metadata,
      runtime: { scale: asset.options.scale },
    },
  ];
}

/**
 * Writes the skeleton in the format selected during resolution.
 *
 * JSON must be parsed before it can be serialized without optional whitespace;
 * this verifies JSON syntax but does not validate the Spine data model. Binary
 * SKEL content cannot be interpreted here and is copied byte-for-byte.
 */
async function writeSpineSkeleton(
  skeleton: ResolvedSpineSkeleton,
  outputDirectory: string,
): Promise<GeneratedFile<'json' | 'skel'>> {
  const outputPath = join(outputDirectory, `skeleton.${skeleton.format}`);

  switch (skeleton.format) {
    case 'json':
      await writeJsonSkeleton(skeleton.path, outputPath);
      break;
    case 'skel':
      await copyFile(skeleton.path, outputPath);
      break;
  }

  return { format: skeleton.format, path: outputPath };
}

/**
 * Minifies a JSON skeleton and identifies its source when parsing fails.
 *
 * Parsing exists solely to remove insignificant JSON whitespace. The parsed
 * value remains unknown because this processor does not enforce a Spine schema.
 */
async function writeJsonSkeleton(inputPath: string, outputPath: string): Promise<void> {
  const sourceText = await readFile(inputPath, 'utf8');
  let skeletonData: unknown;

  try {
    skeletonData = JSON.parse(sourceText);
  } catch (cause) {
    throw new Error(`Invalid Spine JSON skeleton: ${inputPath}`, { cause });
  }

  await writeFile(outputPath, JSON.stringify(skeletonData));
}

/** Copies the authored atlas description and returns its generated-file metadata. */
async function copySpineAtlas(
  inputPath: string,
  outputDirectory: string,
): Promise<GeneratedFile<'atlas'>> {
  const outputPath = join(outputDirectory, 'atlas.atlas');

  // Runtime Spine loading needs the authored regions and page declarations.
  // They are copied unchanged because image optimization does not alter layout.
  await copyFile(inputPath, outputPath);

  return { format: 'atlas', path: outputPath };
}

/**
 * Optimizes texture pages sequentially while preserving their atlas order.
 *
 * Every page independently generates the supported image candidates and keeps
 * its smallest result. A page may hold a large decoded bitmap plus multiple
 * encoded candidates, so sequential processing bounds peak build memory. The
 * loop appends each result in source order, preserving the positional mapping
 * between the returned array and the pages declared by the Spine atlas.
 */
async function writeSpineTexturePages(
  pageSourcePaths: readonly string[],
  outputDirectory: string,
  options: ImageOptions,
): Promise<GeneratedFile<GeneratedImageFormat>[]> {
  const generatedPages: GeneratedFile<GeneratedImageFormat>[] = [];

  for (const [pageIndex, sourcePath] of pageSourcePaths.entries()) {
    const generatedPage = await writeSmallestImage({
      input: sourcePath,
      options,
      outputBasePath: join(outputDirectory, 'images', `page${pageIndex}`),
      sourcePath,
    });

    generatedPages.push(generatedPage);
  }

  return generatedPages;
}
