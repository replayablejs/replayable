import { openFbPlayableStore } from '#fb-playable/api.js';
import type { HostAdapter } from '#types/host-adapter.js';

import { createBrowserAdapter } from '../browser/create-adapter.js';

/**
 * Creates the host adapter used by Moloco standalone playables and interactive
 * end cards. Moloco requires the exact FbPlayableAd CTA contract while ordinary
 * browser signals provide viewport and visibility lifecycle state.
 */
export function createAdapter(): HostAdapter {
  return createBrowserAdapter(openFbPlayableStore);
}
