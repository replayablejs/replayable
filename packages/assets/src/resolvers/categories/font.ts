import type { ResolutionContext } from '#types/resolution.js';
import type { ResolvedFontAsset } from '#types/resolved-assets.js';

import { createFontCharset } from '../font-charset.js';
import { resolveSimpleSources } from '../simple-sources.js';

/** Resolves matched fonts with the complete charset required by the locale build. */
export function resolveFonts(
  context: ResolutionContext,
  localeCharacters: string,
): ResolvedFontAsset[] {
  return resolveSimpleSources(context, 'fonts').map((source) => ({
    ...source,
    category: 'fonts',
    charset: createFontCharset(localeCharacters, source.options.extraCharacters),
  }));
}
