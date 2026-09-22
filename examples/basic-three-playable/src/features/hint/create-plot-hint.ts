import { playable } from '@replayablejs/runtime';
import { animate } from '@replayablejs/tween';
import type { TweenPlaybackControls } from '@replayablejs/tween';
import type { Object3D } from 'three';

import type { PlotHintConfig } from '../../types/plot-hint';
import { plotHintAnimation as timing } from './configs/plot-hint';

/** Owns hint timing and animation. Plot markers remain ordinary scene objects. */
export function createPlotHint({ markers, delay }: PlotHintConfig) {
  let pulse: TweenPlaybackControls | undefined;
  let activeMarker: Object3D | undefined;
  const inactivity = playable.timers.createInactivityTimer({
    duration: delay,
    onTimeout: pulseAvailablePlot,
  });

  return { start, stop };

  /** Gameplay starts the countdown initially and after each placement settles. */
  function start(): void {
    inactivity.restart();
  }

  /** Cancel immediately on placement or completion and restore the outline's size. */
  function stop(): void {
    inactivity.stop();
    pulse?.cancel();
    pulse = undefined;
    activeMarker?.scale.set(1, 1, 1);
    activeMarker = undefined;
  }

  /** Hidden markers are occupied plots; only the first remaining outline pulses. */
  function pulseAvailablePlot(): void {
    const marker = markers.find((candidate) => candidate.visible);
    if (!marker) {
      return;
    }
    activeMarker = marker;
    pulse = animate(1, [1, timing.scale, 1], {
      duration: timing.duration,
      ease: 'easeInOut',
      repeat: timing.repeat,
      repeatDelay: timing.repeatDelay,
      onUpdate: (scale) => marker.scale.set(scale, 1, scale),
      onComplete: start,
    });
  }
}
