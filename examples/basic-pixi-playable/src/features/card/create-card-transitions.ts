import { animate, type TweenPlaybackControls } from '@replayablejs/tween';

import type { CardTransitions, CardView } from '../../types/card';

/** Prepares hidden Spine artwork; explicit show/hide calls start entrance and exit playback. */
export function createCardTransitions({ spine, bounds }: CardView): CardTransitions {
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  // Start 3.5% of card height below the resting position, independent of screen resolution.
  const hiddenY = centerY + bounds.height * 0.035;

  // Natural completion and an explicit board stop share the one-time entrance notification.
  let entered = false;
  let entrance: TweenPlaybackControls | undefined;
  let onEntranceComplete: (() => void) | undefined;

  // Exit playback is separate so it can be stopped during teardown.
  let exit: TweenPlaybackControls | undefined;

  // Prepare the hidden pose without starting a tween. Scale 0.96 is 4% below resting size.
  spine.position.set(centerX, hiddenY);
  spine.alpha = 0;
  spine.scale.set(0.96);

  return { show, settle, hide, destroy };

  /** Start once; an entrance already settled by a board stop completes immediately. */
  function show(delay: number, onComplete: () => void): void {
    if (entered) {
      onComplete();
      return;
    }
    if (entrance !== undefined) {
      return;
    }
    onEntranceComplete = onComplete;
    // Fade and rise over 0.38s while scaling from 96% through a 101.5% overshoot
    // back to 100% over 0.45s. Both tracks start together; the scale finishes last.
    entrance = animate(
      [
        [spine, { alpha: [0, 1], y: [hiddenY, centerY] }, { duration: 0.38, ease: 'easeOut' }],
        [
          spine.scale,
          { x: [0.96, 1.015, 1], y: [0.96, 1.015, 1] },
          { at: 0, duration: 0.45, ease: 'easeOut' },
        ],
      ],
      { delay, onComplete: finishEntrance },
    );
  }

  /** An explicit stop can settle decoration; completed entrances need no further writes. */
  function settle(): void {
    if (entered) {
      return;
    }
    entrance?.stop();
    spine.alpha = 1;
    spine.position.set(centerX, centerY);
    spine.scale.set(1);
    finishEntrance();
  }

  /** Reverse the settled entrance; the card disables input and settles before calling. */
  function hide(delay: number, onComplete: () => void): void {
    exit?.stop();
    // Reverse the scale path: 100% -> 101.5% -> 96%. Delay the 0.38s fade/drop
    // by 0.07s so it ends with the 0.45s scale track (0.07 + 0.38 = 0.45).
    exit = animate(
      [
        [
          spine.scale,
          { x: [1, 1.015, 0.96], y: [1, 1.015, 0.96] },
          { duration: 0.45, ease: 'easeIn' },
        ],
        [
          spine,
          { alpha: [1, 0], y: [centerY, hiddenY] },
          { at: 0.07, duration: 0.38, ease: 'easeIn' },
        ],
      ],
      { delay, onComplete },
    );
  }

  /** Release animation targets before the card destroys its display objects. */
  function destroy(): void {
    entrance?.stop();
    exit?.stop();
    onEntranceComplete = undefined;
  }

  /** Report once, whether the tween finished naturally or a board stop settled it early. */
  function finishEntrance(): void {
    if (entered) {
      return;
    }
    entered = true;
    // Clear before notifying: the callback may synchronously stop or destroy the board.
    const notify = onEntranceComplete;
    onEntranceComplete = undefined;
    notify?.();
  }
}
