import { createMraidHostAdapter } from '#mraid/create-adapter.js';
import type { HostAdapter } from '#types/host-adapter.js';

/**
 * Creates the host adapter used by Unity playable ads.
 *
 * Unity uses the standard MRAID lifecycle and mraid.open() behavior provided
 * by Replayable's shared, analyzer-visible MRAID adapter.
 */
export function createAdapter(): HostAdapter {
  return createMraidHostAdapter();
}
