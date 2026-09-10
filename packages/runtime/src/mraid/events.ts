import type { HostUpdateListener } from '#types/host-adapter.js';
import type { MraidApi } from '#types/mraid.js';

import { normalizeMraidVolume } from './volume.js';

/** MRAID SDK object injected by the active advertising host. */
declare const mraid: MraidApi;

/**
 * Translates MRAID lifecycle events into Replayable host updates.
 *
 * MRAID 3 replaces the MRAID 2 viewability signal with a more precise exposure
 * percentage and adds host audio volume. Both versions share sizeChange. The
 * adapter subscribes only to the event set supported by the detected SDK version.
 */
export function subscribeToMraidUpdates(listener: HostUpdateListener): void {
  const handleViewableChange = (visible: boolean): void => {
    listener({ type: 'visibilitychange', visible });
  };

  const handleExposureChange = (exposedPercentage: number): void => {
    listener({
      type: 'visibilitychange',
      visible: exposedPercentage > 0,
    });
  };

  const handleSizeChange = (width: number, height: number): void => {
    listener({
      type: 'resize',
      viewport: { height, width },
    });
  };

  const handleAudioVolumeChange = (volume: number | null): void => {
    if (volume === null) {
      return;
    }

    listener({
      type: 'volumechange',
      volume: normalizeMraidVolume(volume),
    });
  };

  mraid.addEventListener('sizeChange', handleSizeChange);

  if (supportsMraid3()) {
    mraid.addEventListener('exposureChange', handleExposureChange);
    mraid.addEventListener('audioVolumeChange', handleAudioVolumeChange);
    return;
  }

  mraid.addEventListener('viewableChange', handleViewableChange);
}

/** Enables events introduced in MRAID 3 while preserving the MRAID 2 baseline. */
function supportsMraid3(): boolean {
  return Number.parseFloat(mraid.getVersion()) >= 3;
}
