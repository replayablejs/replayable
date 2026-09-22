import { animate } from '@replayablejs/tween';
import type { TweenPlaybackControls } from '@replayablejs/tween';

import type { EndCardEntranceConfig } from '../../types/end-card';
import { endCardAnimation as timing } from './configs/end-card-animation';

/** Fade the backdrop now, reveal the CTA after the logo, then let the CTA breathe. */
export function animateEndCard({ backdrop, button, animation }: EndCardEntranceConfig) {
  let buttonBreathing: TweenPlaybackControls | undefined;

  // Set the first frame synchronously, before Motion schedules animation work.
  backdrop.style.opacity = '0';
  button.style.opacity = '0';

  const backdropFade = fadeBackdrop();
  const buttonEntrance = revealButton();

  return { destroy };

  /** Dim the city while the UI moves its logo into the end-card position. */
  function fadeBackdrop(): TweenPlaybackControls {
    return animate(backdrop, { opacity: [0, 1] }, { duration: timing.backdropDuration });
  }

  /** Wait for the logo, then bring in the button with a small scale overshoot. */
  function revealButton(): TweenPlaybackControls {
    return animate(
      button,
      {
        opacity: [0, 1],
        scale: [timing.buttonStartScale, 1],
        y: [timing.buttonStartOffset, 0],
      },
      {
        delay: timing.logoDuration,
        duration: timing.buttonDuration,
        ease: 'backOut',
        onComplete: startButtonBreathing,
      },
    );
  }

  /** Start only after the entrance finishes so two animations never scale the button together. */
  function startButtonBreathing(): void {
    // Two repeats after the first cycle give finite networks three breaths total.
    const repeats = animation === 'finite' ? 2 : Infinity;

    buttonBreathing = animate(
      button,
      { scale: [1, timing.breathingScale, 1] },
      {
        delay: timing.breathingDelay,
        duration: timing.breathingDuration,
        ease: 'easeInOut',
        repeat: repeats,
        repeatDelay: timing.breathingRepeatDelay,
      },
    );
  }

  /** Cancel the entrance and any breathing loop when the end card is removed. */
  function destroy(): void {
    backdropFade.cancel();
    buttonEntrance.cancel();
    buttonBreathing?.cancel();
  }
}
