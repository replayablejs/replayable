import type { HostAdapter } from '#types/host-adapter.js';

import { createBrowserAdapter } from '../browser/create-adapter.js';

/** API injected by Google Ads through its network-owned Exit API script. */
declare const ExitApi: {
  exit(): void;
};

/**
 * Creates the host adapter used by Google App Campaign playable ads.
 *
 * Google playables use ordinary browser lifecycle signals, while `ExitApi`
 * records the CTA and opens the campaign-owned destination.
 */
export function createAdapter(): HostAdapter {
  return createBrowserAdapter(() => {
    ExitApi.exit();
  });
}
