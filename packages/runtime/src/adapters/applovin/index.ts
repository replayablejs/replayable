import { createMraidHostAdapter } from '#mraid/create-adapter.js';
import type { HostAdapter } from '#types/host-adapter.js';

/**
 * Creates the host adapter used by AppLovin playable ads.
 *
 * AppLovin requires the MRAID 2 lifecycle and mraid.open() for store
 * navigation. Newer containers may expose MRAID 3 signals, which the shared
 * protocol helpers normalize without changing AppLovin's network identity.
 */
export function createAdapter(): HostAdapter {
  return createMraidHostAdapter();
}
