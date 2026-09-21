import { propEffect } from 'motion';

/**
 * Disconnects all plain-object property bindings and discards pending writes.
 * Stop the target's tweens first, then release it before destroying its artwork.
 * This does not stop playback or recursively release nested objects such as scale.
 * DOM styles and attributes are not handled by this plain-object API.
 */
export function release(target: object): void {
  propEffect.state(target)?.release();
}
