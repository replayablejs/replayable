import type { Object3D } from 'three';

export interface PlotHintConfig {
  readonly markers: readonly Object3D[];
  /** Visible seconds of inactivity before an empty plot pulses. */
  readonly delay: number;
}
