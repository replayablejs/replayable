import type { HostUpdateListener } from '#types/host-adapter.js';

import { isDocumentVisible, readBrowserViewport } from './api.js';

/**
 * Translates browser visibility and viewport events into Replayable host updates.
 *
 * The adapter intentionally publishes every browser notification. The runtime
 * owns state comparison and suppresses duplicate public lifecycle events.
 */
export function subscribeToBrowserUpdates(listener: HostUpdateListener): void {
  const handleVisibilityChange = (): void => {
    listener({
      type: 'visibilitychange',
      visible: isDocumentVisible(),
    });
  };

  const handleResize = (): void => {
    listener({
      type: 'resize',
      viewport: readBrowserViewport(),
    });
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  addViewportListener(handleResize);
}

/** Observes the same viewport source used by `readBrowserViewport`. */
function addViewportListener(listener: () => void): void {
  const viewport = window.visualViewport;

  if (viewport !== null && viewport !== undefined) {
    viewport.addEventListener('resize', listener);
    return;
  }

  window.addEventListener('resize', listener);
}
