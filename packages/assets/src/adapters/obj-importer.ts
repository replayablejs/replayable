import type { Document, NodeIO } from '@gltf-transform/core';
import obj2gltf from 'obj2gltf';

import { validateObjMaterials } from './obj-material-validator.js';

/**
 * Converts an OBJ entry and its referenced materials/images into a glTF document.
 *
 * obj2gltf produces an in-memory binary GLB, which is then read through the same
 * configured NodeIO instance used for other model formats. No intermediate file
 * is written. The caller owns subsequent optimization and final serialization.
 *
 * Secure dependency resolution restricts references to the referring file's
 * directory or its descendants. Transparency inspection preserves image alpha
 * when converting MTL materials. Geometry-only OBJ and plain-color MTL sources
 * do not require texture images unless their material definitions reference them.
 *
 * The upstream importer can recover from missing MTL or image files by supplying
 * defaults. Replayable rejects those diagnostics instead of silently changing
 * authored appearance. Explicit usemtl names are also validated against declared
 * MTL definitions because the importer does not log unknown names. Only resizing messages for combining color and alpha maps
 * are accepted. Diagnostics are accumulated and checked after the intermediate
 * GLB is parsed; importer and parser exceptions propagate directly.
 *
 * @param path - Filesystem path of the OBJ entry; relative dependencies resolve from it.
 * @param io - Model I/O instance configured with extension handlers and strict logging.
 * @returns A decoded document containing the converted geometry and material resources.
 * @throws If conversion or GLB parsing fails, or the importer reports any diagnostic
 * other than the accepted texture-resizing notification.
 *
 * @example
 *
 * ```ts
 * const io = await createModelIO();
 * const document = await readObjModel('/project/assets/models/car/car.obj', io);
 *
 * // car.obj may reference car.mtl and images below the same directory.
 * console.log(document.getRoot().listMaterials().length);
 * ```
 */
export async function readObjModel(path: string, io: NodeIO): Promise<Document> {
  await validateObjMaterials(path);

  const diagnostics: string[] = [];
  const bytes = await obj2gltf(path, {
    binary: true,
    checkTransparency: true,
    secure: true,
    logger(message) {
      // Combining MTL color and alpha images may require resizing. This is
      // informational; all other diagnostics must fail the conversion.
      if (/^Texture .* will be scaled from /.test(message)) {
        return;
      }
      diagnostics.push(message);
    },
  });
  const document = await io.readBinary(bytes);

  // obj2gltf normally tolerates missing dependencies and supplies defaults.
  if (diagnostics.length > 0) {
    throw new Error(diagnostics.join('\n'));
  }

  return document;
}
