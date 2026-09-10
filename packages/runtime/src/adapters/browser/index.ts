import type { HostAdapter } from '#types/host-adapter.js';

import { createBrowserAdapter } from './create-adapter.js';

/**
 * Creates the host adapter used by local development and ordinary browsers.
 *
 * Preview opens the resolved store URL directly, while its lifecycle behavior
 * comes from the browser adapter shared with browser-based advertising hosts.
 */
export function createAdapter(): HostAdapter {
  return createBrowserAdapter((url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}
