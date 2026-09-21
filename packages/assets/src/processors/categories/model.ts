import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { optimizeModel, readModel } from '#adapters/model-converter.js';
import { createSimpleAssetId } from '#pipeline/asset-identity.js';
import type { GeneratedFile, ProcessedModelAsset } from '#types/processed-assets.js';
import type { ResolvedModelAsset } from '#types/resolved-assets.js';

import { processModelTextures } from '../model-textures.js';

/**
 * Emits one self-contained GLB and the metadata needed for its runtime entry.
 *
 * OBJ, glTF, and GLB entries share the same output contract. The model adapter
 * reads the source and its dependencies, texture processing updates embedded
 * images, and optimization applies the configured geometry compression. The
 * final GLB contains geometry, materials, images, and any supported authored
 * skins or animation clips; dependencies do not become separate runtime assets.
 *
 * For example, these resolved source files:
 *
 * ```text
 * models/vehicles/car.obj
 * models/vehicles/car.mtl       -> references Textures/paint.png
 * models/vehicles/Textures/paint.png
 * ```
 *
 * produce one file relative to the output directory:
 *
 * ```text
 * models/vehicles/car.glb
 * ```
 *
 * The processed asset has ID `vehicles/car`, retains the resolved bundle, and
 * records the selected compression for runtime loader setup. The emitter owns
 * the final `src` import or URL; this processor returns physical file metadata.
 * The one-item array follows the common processor contract even though model
 * conversion always produces exactly one logical asset and one resource file.
 *
 * @param asset - Resolved model entry with validated options and an output base
 * path. During a build, that path points into the build's staging directory.
 * @returns One processed model after its GLB has been written successfully.
 * @throws A source-specific error retaining the original cause if reading,
 * texture processing, optimization, serialization, or file writing fails.
 * Staging cleanup and publication are handled by the surrounding build pipeline.
 */
export async function processModel(asset: ResolvedModelAsset): Promise<ProcessedModelAsset[]> {
  try {
    const bytes = await convertModelToGlb(asset);
    const file = await writeModelFile(asset.outputBasePath, bytes);

    return [createProcessedModel(asset, file)];
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Cannot process model ${asset.relativePath}: ${message}`, { cause });
  }
}

/**
 * Reads, transforms, and serializes a model without writing intermediate files.
 *
 * Reading decodes source compression and clears its output policy. Texture
 * processing runs before storage optimization so deduplication sees the final
 * image data. Optimization gathers buffers and selects the requested codec;
 * actual compression is completed by the final binary write.
 *
 * The same I/O instance is used for reading and serialization, retaining the
 * registered extensions, initialized codecs, and strict diagnostic policy.
 * The returned bytes are ready to write as a self-contained GLB. Keeping this
 * work ahead of filesystem writes avoids creating an output file when conversion
 * itself fails.
 */
async function convertModelToGlb(asset: ResolvedModelAsset): Promise<Uint8Array> {
  const { document, io } = await readModel(asset.absolutePath);

  await processModelTextures(document, asset.options.textures);
  await optimizeModel(document, asset.options);

  return io.writeBinary(document);
}

/**
 * Writes the completed GLB at the resolver's extensionless output base path.
 *
 * Nested source directories are reflected in that path, so the parent directory
 * is created recursively. This helper only writes into its assigned destination;
 * it does not publish the staging directory or roll back a failed build.
 * File metadata is returned only after the write has completed successfully.
 */
async function writeModelFile(
  outputBasePath: string,
  bytes: Uint8Array,
): Promise<GeneratedFile<'glb'>> {
  const path = `${outputBasePath}.glb`;

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);

  return { format: 'glb', path };
}

/**
 * Maps resolved identity and generated-file metadata to the shared processor contract.
 *
 * The ID comes from the category-relative source path without its extension,
 * rather than from a scene or mesh name inside the model. Compression describes
 * the generated resource, not the source file's original codec. No loader is
 * instantiated here; runtime integrations consume the emitted metadata later.
 */
function createProcessedModel(
  asset: ResolvedModelAsset,
  file: GeneratedFile<'glb'>,
): ProcessedModelAsset {
  return {
    bundle: asset.bundle,
    category: 'models',
    id: createSimpleAssetId(asset),
    file,
    runtime: { compression: asset.options.compression },
  };
}
