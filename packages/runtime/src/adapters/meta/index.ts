import { openFbPlayableStore } from '#fb-playable/api.js';
import type { HostAdapter } from '#types/host-adapter.js';

import { createBrowserAdapter } from '../browser/create-adapter.js';

/**
 * Creates the host adapter used by Meta playable ads.
 *
 * Meta playables use ordinary browser lifecycle signals, but their campaign
 * owns the store destination and requires this exact CTA API call.
 */
export function createAdapter(): HostAdapter {
  return createBrowserAdapter(openFbPlayableStore);
}
