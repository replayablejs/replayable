import type { SoundControl } from '#types/sound-control.js';

const disabledSoundControl: SoundControl = { destroy(): void {} };

/** Production never loads the control's UI, icons, or runtime subscriptions. */
export function createSoundControl(): SoundControl {
  return disabledSoundControl;
}
