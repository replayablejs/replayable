import type { PlayableVariant } from '@replayablejs/config';

import type { NetworkHtmlHead } from '#types/network.js';

const EXIT_API_URL = 'https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js';

/** Resolves the production document elements required by Google App Campaigns. */
export function resolveGoogleHtmlHead(variant: PlayableVariant): NetworkHtmlHead {
  return {
    metaTags: [
      {
        name: 'ad.orientation',
        content: resolveOrientation(variant.screen.orientations),
      },
    ],
    scripts: [{ src: EXIT_API_URL }],
  };
}

/** Converts Replayable's enabled layouts into Google's orientation-tag value. */
function resolveOrientation(orientations: PlayableVariant['screen']['orientations']): string {
  const { landscape, portrait } = orientations;

  if (landscape.enabled && portrait.enabled) {
    return 'portrait,landscape';
  }

  return portrait.enabled ? 'portrait' : 'landscape';
}
