import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { GeneratedFile, ProcessedShaderAsset } from '#types/processed-assets.js';
import type { ResolvedShaderAsset } from '#types/resolved-assets.js';

/**
 * Copies a vertex/fragment pair without changing its authored GLSL.
 *
 * One resolved shader becomes one logical processed asset that owns its
 * generated vertex and fragment files. Keeping the pair together means every
 * later stage receives a complete runtime shader instead of reconstructing it
 * from unrelated records.
 *
 * For example, the resolved sources:
 *
 * ```text
 * assets/source/shaders/glow/vert.glsl
 * assets/source/shaders/glow/frag.glsl
 * ```
 *
 * are copied byte-for-byte to:
 *
 * ```text
 * assets/generated/shaders/glow/vert.glsl
 * assets/generated/shaders/glow/frag.glsl
 * ```
 *
 * and returned as one processed asset whose ID is `glow` and whose `files`
 * object contains both generated files. The emitter can therefore serialize a
 * complete shader program without pairing independent file records.
 */
export async function processShader(asset: ResolvedShaderAsset): Promise<ProcessedShaderAsset[]> {
  const vertexOutputPath = join(asset.outputDirectory, 'vert.glsl');
  const fragmentOutputPath = join(asset.outputDirectory, 'frag.glsl');

  await mkdir(asset.outputDirectory, { recursive: true });

  // Two small copies stay sequential so a failure leaves no pending writer.
  const vertexFile = await copyShaderStage(asset.shader.vert, vertexOutputPath);
  const fragmentFile = await copyShaderStage(asset.shader.frag, fragmentOutputPath);

  return [
    {
      bundle: asset.bundle,
      category: 'shaders',
      files: { frag: fragmentFile, vert: vertexFile },
      id: asset.shader.id,
    },
  ];
}

/**
 * Copies one shader stage byte-for-byte and describes the generated file.
 *
 * The returned value contains the file's format and path, not its GLSL source.
 * Emitters later use this metadata to create the runtime import.
 */
async function copyShaderStage(
  inputPath: string,
  outputPath: string,
): Promise<GeneratedFile<'glsl'>> {
  await copyFile(inputPath, outputPath);

  return { format: 'glsl', path: outputPath };
}
