import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedImageAsset } from '#types/resolved-assets.js';

import { resolveSimpleSources } from '../simple-sources.js';

/** Resolves matched non-localized texture sources. */
export function resolveTextures(context: ResolutionContext): ResolvedImageAsset[] {
  return resolveSimpleSources(context, 'textures').map((source) => ({
    ...source,
    category: 'textures',
  }));
}
