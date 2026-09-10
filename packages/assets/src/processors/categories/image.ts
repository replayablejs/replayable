import { createSimpleAssetId } from '#pipeline/asset-identity.js';
import type { ProcessedImageAsset } from '#types/processed-assets.js';
import type { ResolvedImageAsset } from '#types/resolved-assets.js';

import { writeSmallestImage } from '../image-encoder.js';

/**
 * Processes one standalone sprite or texture into one selected runtime file.
 *
 * Asset rules configure intent (`lossless`, `quality`, and `scale`), not an
 * output extension. The shared image encoder generates every applicable
 * candidate and keeps only the smallest file, so the emitted runtime value
 * always references one URL.
 *
 * For example, `sprites/ui/button.png` may be encoded as AVIF, WebP, and PNG.
 * If WebP is smallest, only `sprites/ui/button.webp` remains and this function
 * returns one processed sprite containing that file.
 *
 * The absolute path is used to read the source, while the relative path is
 * retained for human-readable processing errors. The resolved category is
 * preserved because this processor serves both `sprites` and `textures`.
 * Runtime `scale` records the image transformation applied by the encoder. The
 * returned one-item array follows the common processor contract: one resolved
 * image produces one processed asset.
 */
export async function processImage(asset: ResolvedImageAsset): Promise<ProcessedImageAsset[]> {
  const selectedFile = await writeSmallestImage({
    input: asset.absolutePath,
    options: asset.options,
    outputBasePath: asset.outputBasePath,
    sourcePath: asset.relativePath,
  });

  return [
    {
      bundle: asset.bundle,
      category: asset.category,
      file: selectedFile,
      id: createSimpleAssetId(asset),
      runtime: { scale: asset.options.scale },
    },
  ];
}
