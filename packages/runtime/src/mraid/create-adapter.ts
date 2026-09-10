import { FULL_VOLUME } from '#lifecycle/volume.js';
import type { HostAdapter, HostSnapshot, HostUpdateListener } from '#types/host-adapter.js';
import type { MraidApi } from '#types/mraid.js';

import { readMraidViewport, requireMraid, waitForMraidReady } from './api.js';
import { subscribeToMraidUpdates } from './events.js';

/** MRAID SDK object injected by the active advertising host. */
declare const mraid: MraidApi;

/**
 * Creates the standard MRAID host behavior shared by networks whose CTA opens
 * the authored store URL directly through `mraid.open(url)`.
 */
export function createMraidHostAdapter(): HostAdapter {
  return {
    async initialize(listener): Promise<HostSnapshot> {
      requireMraid();
      await waitForMraidReady();

      subscribeToMraidUpdates(listener);
      subscribeToBrowserViewportChanges(listener);

      return {
        visible: mraid.isViewable(),
        viewport: readMraidViewport(),
        // MRAID 2 has no initial volume query. Start audible and let MRAID 3's
        // audioVolumeChange event publish the host's first authoritative value.
        volume: FULL_VOLUME,
      };
    },

    openStore(url): void {
      requireMraid();
      mraid.open(url);
    },
  };
}

/**
 * Supplements MRAID sizeChange with browser signals emitted by host WebViews
 * during device rotation. Runtime state deduplicates equivalent dimensions.
 */
function subscribeToBrowserViewportChanges(listener: HostUpdateListener): void {
  const handleViewportChange = (): void => {
    listener({
      type: 'resize',
      viewport: readMraidViewport(),
    });
  };

  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);
}
