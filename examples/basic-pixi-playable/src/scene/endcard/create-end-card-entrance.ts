import { animate, type TweenPlaybackControls } from '@replayablejs/tween';
import type { Container } from 'pixi.js';

import type { EndCardButton, EndCardEntrance } from '../../types/end-card';

/** Animates existing popup and CTA artwork; owns no scene objects or layout placement. */
export function createEndCardEntrance(rating: Container, button: EndCardButton): EndCardEntrance {
  const ratingY = rating.y;
  const rise = rating.getLocalBounds().height * 0.035;
  let animation: TweenPlaybackControls | undefined;
  let showing: Promise<void> | undefined;
  let rejectShown: ((reason: DOMException) => void) | undefined;
  let destroyed = false;

  return { show, destroy };

  /** Repeated calls share one entrance; destruction never returns an old successful wait. */
  function show(): Promise<void> {
    if (destroyed) {
      return Promise.reject(new DOMException('Endcard was destroyed.', 'AbortError'));
    }
    showing ??= new Promise<void>(start);
    return showing;
  }

  /** Prepare synchronously so the owner can reveal the layer without a full-size flash. */
  function prepare(): void {
    rating.alpha = 0;
    rating.y = ratingY + rise;
    rating.scale.set(0.94);
    button.container.alpha = 0;
    button.container.scale.set(0.9);
  }

  /** The popup rises first; the CTA follows 0.1 seconds later. Times are in seconds. */
  function start(resolve: () => void, reject: (reason: DOMException) => void): void {
    rejectShown = reject;
    prepare();
    animation = animate(
      [
        [
          rating,
          { alpha: [0, 1], y: [ratingY + rise, ratingY] },
          { duration: 0.35, ease: 'easeOut' },
        ],
        [
          rating.scale,
          { x: [0.94, 1.02, 1], y: [0.94, 1.02, 1] },
          { at: 0, duration: 0.35, ease: 'easeOut' },
        ],
        [button.container, { alpha: [0, 1] }, { at: 0.1, duration: 0.2 }],
        [
          button.container.scale,
          { x: [0.9, 1.04, 1], y: [0.9, 1.04, 1] },
          { at: 0.1, duration: 0.35, ease: 'easeOut' },
        ],
      ],
      { onComplete: finish },
    );

    /** Hand the button's scale to attention only after entrance finishes at scale 1. */
    function finish(): void {
      if (destroyed) {
        return;
      }
      rejectShown = undefined;
      button.playAttention();
      resolve();
    }
  }

  /** Cancel playback and its pending wait before the owner destroys the animated artwork. */
  function destroy(): void {
    destroyed = true;
    animation?.stop();
    rejectShown?.(new DOMException('Endcard was destroyed.', 'AbortError'));
    rejectShown = undefined;
  }
}
