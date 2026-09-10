import type { HostAdapter, HostSnapshot } from '#types/host-adapter.js';

import { createBrowserSnapshot, waitForDocumentReady } from './api.js';
import { subscribeToBrowserUpdates } from './events.js';

/**
 * Creates a browser-backed host adapter with caller-provided store behavior.
 *
 * Preview and browser-based network adapters share document readiness,
 * visibility, and viewport handling. Only their click-through APIs differ.
 */
export function createBrowserAdapter(openStore: HostAdapter['openStore']): HostAdapter {
  return {
    async initialize(listener): Promise<HostSnapshot> {
      await waitForDocumentReady();

      subscribeToBrowserUpdates(listener);

      return createBrowserSnapshot();
    },

    openStore,
  };
}
