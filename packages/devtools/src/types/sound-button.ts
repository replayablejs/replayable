import type { SoundControl } from './sound-control.js';

/** DOM presentation and input isolation for the development sound control. */
export interface SoundButton extends SoundControl {
  update(muted: boolean): void;
  setVisible(visible: boolean): void;
}
