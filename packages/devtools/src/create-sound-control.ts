import { playable } from '@replayablejs/runtime';

import type { SoundControl } from '#types/sound-control.js';

import { createSoundButton } from './sound-control/create-sound-button.js';
import { createSoundControl as createDisabledControl } from './sound-control/disabled.js';

/** Creates a development-only audio toggle after await playable.ready(). */
export function createSoundControl(): SoundControl {
  if (!playable.config.devtools.soundControl || !playable.config.audio) {
    return createDisabledControl();
  }

  // Enforce readiness before allocating DOM or subscriptions.
  const { visible } = playable.state;
  const button = createSoundButton(toggleSound);
  button.update(playable.audio.muted);
  button.setVisible(visible);
  const removeAudioListener = playable.on('audiochange', handleAudioChange);
  const removeVisibilityListener = playable.on('visibilitychange', handleVisibilityChange);
  let destroyed = false;

  return { destroy };

  /** Synchronous on the trusted click; never overrides host permission or queues sound. */
  function toggleSound(): void {
    if (!destroyed && playable.state.visible) {
      playable.audio.setMuted(!playable.audio.muted);
      // setMuted changes the user preference; audiochange reports host audio state.
      handleAudioChange();
    }
  }

  /** Show the user's mute preference, not temporary host restrictions or loading state. */
  function handleAudioChange(): void {
    button.update(playable.audio.muted);
  }

  /** Keep the control available on the endcard, but not while the playable is hidden. */
  function handleVisibilityChange(): void {
    button.setVisible(playable.state.visible);
  }

  /** Unsubscribe before detaching DOM; repeated cleanup is harmless. */
  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;
    removeAudioListener();
    removeVisibilityListener();
    button.destroy();
  }
}
