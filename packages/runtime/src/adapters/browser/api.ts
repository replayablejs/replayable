import { FULL_VOLUME } from '#lifecycle/volume.js';
import type { HostSnapshot } from '#types/host-adapter.js';
import type { RuntimeViewport } from '#types/screen.js';

/** Waits until authored application code may safely access the parsed document. */
export async function waitForDocumentReady(): Promise<void> {
  if (document.readyState !== 'loading') {
    return;
  }

  await new Promise<void>((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
  });
}

/** Captures every browser-owned lifecycle value as one consistent snapshot. */
export function createBrowserSnapshot(): HostSnapshot {
  return {
    visible: isDocumentVisible(),
    viewport: readBrowserViewport(),
    // Ordinary browsers do not expose host-controlled ad volume.
    volume: FULL_VOLUME,
  };
}

/** Uses the visual viewport when available because it represents the visible ad area. */
export function readBrowserViewport(): RuntimeViewport {
  const viewport = window.visualViewport;

  if (viewport !== null && viewport !== undefined) {
    return {
      width: viewport.width,
      height: viewport.height,
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/** Treats prerendered and background documents as not viewable. */
export function isDocumentVisible(): boolean {
  return document.visibilityState === 'visible';
}
