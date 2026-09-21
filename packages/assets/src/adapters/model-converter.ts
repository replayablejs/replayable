import { extname } from 'node:path';

import { PropertyType, type Document, type NodeIO } from '@gltf-transform/core';
import { dedup, draco, meshopt, unpartition } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';

import type { ModelOptions } from '#types/asset-options.js';

import { createModelIO } from './model-io.js';
import { readObjModel } from './obj-importer.js';

/** Source codec declarations removed after decoding, before choosing output compression. */
const compressionExtensions = new Set([
  'KHR_draco_mesh_compression',
  'EXT_meshopt_compression',
  'KHR_meshopt_compression',
]);

/**
 * Reads an authored OBJ, glTF, or GLB into an editable glTF Transform document.
 *
 * OBJ sources first pass through the OBJ importer, which resolves their MTL and
 * image dependencies. glTF and GLB sources are read directly with registered
 * extension handlers and decoders. Both paths use the same strict I/O policy.
 *
 * Reading expands compressed source data. Its compression extensions are then
 * removed so a source codec cannot override the requested output setting,
 * including when that setting is `none`. Scene and material extensions remain.
 *
 * @param path - Filesystem path of a supported model entry selected by the resolver.
 * @returns The decoded document and its configured I/O instance. Keep that I/O
 * instance for the final GLB write so extension handlers and encoders are available.
 * @throws If codec initialization, source reading, dependency resolution, or
 * strict importer diagnostics fail. The processor adds the asset path context.
 *
 * @example
 *
 * ```ts
 * const { document, io } = await readModel('/project/assets/models/car.obj');
 *
 * // Process embedded textures and call optimizeModel before the final write.
 * const bytes = await io.writeBinary(document);
 * ```
 */
export async function readModel(path: string): Promise<{ document: Document; io: NodeIO }> {
  const io = await createModelIO();
  const document = await readSourceModel(path, io);

  removeSourceCompression(document);

  return { document, io };
}

/**
 * Optimizes storage in place and applies the selected output geometry codec.
 *
 * Deduplication is restricted to accessors and textures: scene nodes, meshes,
 * materials, names, skins, and animation structure are not deduplication targets.
 * Unpartitioning gathers buffers for the subsequent self-contained GLB write.
 * These shared steps also run when compression is `none`.
 *
 * Draco uses the transform's default settings. Meshopt uses its medium preset,
 * which may quantize attributes; compression is not a promise of byte-identical
 * geometry. Texture image encoding is handled separately by the processor before
 * this step, rather than by either geometry codec.
 *
 * @param document - Decoded document returned by readModel; mutated in place.
 * @param options - Validated model settings. Only compression is used here.
 * @returns Resolves after the document is ready for serialization by its I/O instance.
 * @throws If a transform or codec fails, including strict document diagnostics.
 */
export async function optimizeModel(document: Document, options: ModelOptions): Promise<void> {
  await document.transform(
    dedup({ propertyTypes: [PropertyType.ACCESSOR, PropertyType.TEXTURE] }),
    unpartition(),
  );

  switch (options.compression) {
    case 'none':
      return;
    case 'draco':
      await document.transform(draco());
      return;
    case 'meshopt':
      await document.transform(meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
      return;
  }
}

/**
 * Dispatches a resolver-approved source to the appropriate reader.
 *
 * Extension comparison is case-insensitive. Only OBJ needs an intermediate GLB;
 * glTF and GLB already use the document format understood by NodeIO. Supported
 * source filtering belongs to the resolver, not this dispatch helper.
 */
async function readSourceModel(path: string, io: NodeIO): Promise<Document> {
  if (extname(path).toLowerCase() === '.obj') {
    return readObjModel(path, io);
  }

  return io.read(path);
}

/**
 * Clears source compression declarations after their data has been decoded.
 *
 * Disposing these extensions prevents a later write from retaining the input
 * codec or combining it with the configured output codec. This must run after
 * reading: disposing declarations before decoding would lose the information
 * needed to interpret compressed buffers. Other extensions are left intact.
 */
function removeSourceCompression(document: Document): void {
  for (const extension of document.getRoot().listExtensionsUsed()) {
    if (compressionExtensions.has(extension.extensionName)) {
      extension.dispose();
    }
  }
}
