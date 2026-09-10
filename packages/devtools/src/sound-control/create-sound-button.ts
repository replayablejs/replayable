import type { SoundButton } from '#types/sound-button.js';

import { installDevtoolsInteraction } from '../interaction/install-devtools-interaction.js';
import soundOff from './assets/sound-off.png';
import soundOn from './assets/sound-on.png';

import styles from './sound-button.css?inline';

/** Mounts renderer-independent UI with the examples' existing sound artwork. */
export function createSoundButton(onToggle: () => void): SoundButton {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'replayable-sound';
  button.setAttribute('role', 'button');
  const icon = document.createElement('img');
  icon.alt = '';
  icon.draggable = false;
  button.append(icon);
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.append(style);
  document.body.append(button);
  const removeInteraction = installDevtoolsInteraction(button, onToggle);

  return { update, setVisible, destroy };

  /** Keep the icon and accessible action synchronized without replacing the image node. */
  function update(muted: boolean): void {
    icon.src = muted ? soundOff : soundOn;
    button.setAttribute('aria-pressed', String(muted));
    button.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    button.title = muted ? 'Unmute sound' : 'Mute sound';
  }

  function setVisible(visible: boolean): void {
    button.hidden = !visible;
  }

  /** Remove capture listeners before detaching their target. */
  function destroy(): void {
    removeInteraction();
    button.remove();
    style.remove();
  }
}
