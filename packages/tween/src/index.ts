/**
 * Lifecycle-aware animation for Replayable playable ads.
 *
 * Importing this package does not subscribe to Replayable's lifecycle or
 * schedule browser frames. The runtime lifecycle binding initializes lazily
 * when animation is first requested.
 *
 * @packageDocumentation
 */

export { animate } from './animate.js';
export { stagger } from 'motion';
export type { TweenPlaybackControls } from '#types/playback.js';
