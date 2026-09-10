import { FULL_VOLUME } from '#lifecycle/volume.js';
import { readMraidViewport, requireMraid, waitForMraidReady } from '#mraid/api.js';
import { subscribeToMraidUpdates } from '#mraid/events.js';
import type { HostAdapter, HostSnapshot } from '#types/host-adapter.js';
import type { LiftoffApi, LiftoffWindow } from '#types/host-apis.js';
import type { MraidApi } from '#types/mraid.js';

/** MRAID SDK object injected by the Liftoff host. */
declare const mraid: MraidApi;

/**
 * Creates the host adapter used by Liftoff playable ads.
 *
 * Liftoff exposes the standard MRAID lifecycle and may additionally inject its
 * own ready/open API. The dedicated API owns campaign click attribution when
 * available; MRAID remains the documented fallback.
 */
export function createAdapter(): HostAdapter {
  let activeLiftoff: LiftoffApi | undefined;

  return {
    async initialize(listener): Promise<HostSnapshot> {
      requireMraid();
      await waitForMraidReady();

      const liftoff = (window as LiftoffWindow).Liftoff;

      if (liftoff !== undefined) {
        await waitForLiftoffReady(liftoff);
        activeLiftoff = liftoff;
      }

      subscribeToMraidUpdates(listener);

      return {
        visible: mraid.isViewable(),
        viewport: readMraidViewport(),
        // MRAID 2 has no initial volume query. MRAID 3 publishes subsequent
        // host volume through the shared audioVolumeChange subscription.
        volume: FULL_VOLUME,
      };
    },

    openStore(): void {
      if (activeLiftoff !== undefined) {
        activeLiftoff.open();
        return;
      }

      // Liftoff injects the campaign destination and documents an argumentless
      // MRAID call, so the authored store URL is intentionally not forwarded.
      requireMraid();
      mraid.open();
    },
  };
}

/** Resolves after Liftoff declares its campaign click API safe to call. */
function waitForLiftoffReady(liftoff: LiftoffApi): Promise<void> {
  return new Promise<void>((resolve) => {
    liftoff.ready(resolve);
  });
}
