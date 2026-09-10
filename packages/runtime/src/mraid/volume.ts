import { FULL_VOLUME } from '#lifecycle/volume.js';

/** Converts MRAID's percentage value into Replayable's normalized range. */
export function normalizeMraidVolume(volume: number): number {
  const normalizedVolume = volume / 100;

  return Math.min(FULL_VOLUME, Math.max(0, normalizedVolume));
}
