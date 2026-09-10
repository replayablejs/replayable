import type { FbPlayableApi } from '#types/host-apis.js';

declare const FbPlayableAd: FbPlayableApi | undefined;

/**
 * Opens the campaign destination through the exact API required by both Meta
 * and Moloco playable containers.
 */
export function openFbPlayableStore(): void {
  if (typeof FbPlayableAd === 'undefined') {
    throw new Error('The active network requires window.FbPlayableAd.');
  }

  FbPlayableAd.onCTAClick();
}
