/**
 * Replayable's single gateway to the Howler implementation.
 *
 * Howler's default entry bundles its core together with the optional spatial
 * audio plugin. Replayable currently needs ordinary playback, looping, volume,
 * and fades, but not stereo panning or 3D positioning. Importing the published
 * core distribution preserves Howler's Web Audio implementation and HTML Audio
 * fallback without shipping those unused spatial features in every playable.
 *
 * Keep the distribution-specific path confined to this module. The rest of the
 * runtime imports `#audio/howler.js`, so changing the Howler integration remains
 * a local implementation decision.
 *
 * @see https://github.com/goldfire/howler.js#quick-start
 * @see https://github.com/goldfire/howler.js/blob/master/dist/howler.core.min.js
 */
export { Howl, Howler } from 'howler/dist/howler.core.min.js';
export type { HowlCallback, HowlErrorCallback } from 'howler/dist/howler.core.min.js';
