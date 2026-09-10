import type { MraidApi } from '#types/mraid.js';
import type { RuntimeViewport } from '#types/screen.js';

/** MRAID SDK object injected by the active advertising host. */
declare const mraid: MraidApi;

/** Fails clearly when a MRAID creative runs without its host-injected SDK. */
export function requireMraid(): void {
  if (typeof mraid === 'undefined') {
    throw new Error('The active network requires the injected global mraid object.');
  }
}

/** Waits for MRAID to leave its initial loading state before SDK access. */
export async function waitForMraidReady(): Promise<void> {
  if (mraid.getState() !== 'loading') {
    return;
  }

  await new Promise<void>((resolve) => {
    const handleReady = (): void => {
      mraid.removeEventListener('ready', handleReady);
      resolve();
    };

    mraid.addEventListener('ready', handleReady);
  });
}

/** Reads the current ad container rather than the device's physical screen. */
export function readMraidViewport(): RuntimeViewport {
  const { height, width } = mraid.getCurrentPosition();

  return { height, width };
}
