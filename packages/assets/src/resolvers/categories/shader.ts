import { resolve } from 'node:path';
import { basename, dirname } from 'node:path/posix';

import type { ShaderSourceGroup } from '#types/resolution.js';
import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedShaderAsset } from '#types/resolved-assets.js';
import type { SourceFile } from '#types/source.js';

import {
  isSupportedSourceFile,
  resolveAssetRule,
  resolveBundle,
  stripCategoryDirectory,
} from '../source-resolution.js';

/**
 * Resolves each matched directory containing `vert.glsl` and `frag.glsl` into
 * one shader asset. For example, `shaders/glow/{vert,frag}.glsl` becomes the
 * runtime shader ID `glow`.
 */
export function resolveShaders(context: ResolutionContext): ResolvedShaderAsset[] {
  const groups = groupShaderSources(context);

  return groups.map((group) => createResolvedShader(context, group));
}

/** Creates the build instruction for one complete shader source pair. */
function createResolvedShader(
  context: ResolutionContext,
  group: ShaderSourceGroup,
): ResolvedShaderAsset {
  const category = 'shaders';
  const id = stripCategoryDirectory(group.directory, category);

  return {
    bundle: resolveBundle(context.config, group.directory),
    category,
    outputDirectory: resolve(context.outputRoot, category, id),
    relativePath: group.directory,
    shader: {
      frag: group.frag.absolutePath,
      id,
      vert: group.vert.absolutePath,
    },
  };
}

/** Finds complete shader directories selected by the configured rules. */
function groupShaderSources(context: ResolutionContext): ShaderSourceGroup[] {
  // Shader resolution considers authored GLSL sources only. Other files may
  // live beside a shader pair but do not participate in its runtime value.
  const shaderFiles = context.files.filter((file) =>
    isSupportedSourceFile('shaders', file.relativePath),
  );

  // One directory represents one logical shader and owns both required stages.
  const filesByDirectory = Map.groupBy(shaderFiles, (file) => dirname(file.relativePath));

  // Group creation returns undefined for directories not selected by a shader
  // rule and validates the required pair for every selected directory.
  const possibleGroups = [...filesByDirectory].map(([directory, directoryFiles]) =>
    createShaderSourceGroup(context, directory, directoryFiles),
  );
  const shaderGroups = possibleGroups.filter((group) => group !== undefined);

  // Stable directory ordering keeps resolver output independent of discovery order.
  return shaderGroups.sort((left, right) => left.directory.localeCompare(right.directory));
}

/** Creates one complete source pair when its directory matches a shader rule. */
function createShaderSourceGroup(
  context: ResolutionContext,
  directory: string,
  files: readonly SourceFile[],
): ShaderSourceGroup | undefined {
  if (resolveAssetRule(context, 'shaders', directory) === undefined) {
    return undefined;
  }

  const vert = files.find((file) => basename(file.relativePath) === 'vert.glsl');
  const frag = files.find((file) => basename(file.relativePath) === 'frag.glsl');

  if (vert === undefined || frag === undefined) {
    throw new Error(`Shader ${directory} must contain vert.glsl and frag.glsl.`);
  }

  return { directory, frag, vert };
}
