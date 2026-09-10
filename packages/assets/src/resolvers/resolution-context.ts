import type { BuildContext } from '#types/context.js';
import type { ResolutionContext } from '#types/resolution.js';
import type { SourceFile } from '#types/source.js';

/** Narrows complete build state to the inputs available during source resolution. */
export function createResolutionContext(
  config: ResolutionContext['config'],
  context: BuildContext,
  files: readonly SourceFile[],
): ResolutionContext {
  return {
    config,
    files,
    outputRoot: context.outputRoot,
  };
}
