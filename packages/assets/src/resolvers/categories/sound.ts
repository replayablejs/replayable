import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedSoundAsset } from '#types/resolved-assets.js';

import { resolveSimpleSources } from '../simple-sources.js';

/** Resolves matched sound sources and their normalized encoding options. */
export function resolveSounds(context: ResolutionContext): ResolvedSoundAsset[] {
  return resolveSimpleSources(context, 'sounds').map((source) => ({
    ...source,
    category: 'sounds',
  }));
}
