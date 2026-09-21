import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedModelAsset } from '#types/resolved-assets.js';

import { resolveSimpleSources } from '../simple-sources.js';

/** Only model entry points are selected; their referenced files belong to that model. */
export function resolveModels(context: ResolutionContext): ResolvedModelAsset[] {
  return resolveSimpleSources(context, 'models').map((source) => ({
    ...source,
    category: 'models',
  }));
}
