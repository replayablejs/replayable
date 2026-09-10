import type { EndCardAnimation } from '@replayablejs/runtime';
import { animate, type TweenPlaybackControls } from '@replayablejs/tween';

import type { EndCardView } from '../../types/view';

/** Reveals the terminal message first, then draws attention to its CTA. */
export function animateEndCard(view: EndCardView, animation: EndCardAnimation): () => void {
  const tweens: TweenPlaybackControls[] = [];
  // Motion counts repeat values after the initial playback, so 2 produces
  // exactly three finite attention cycles before a finite end card settles.
  const attentionRepeats = animation === 'finite' ? 2 : Infinity;

  tweens.push(animate(view.endCard, { opacity: [0, 1] }, { duration: 0.28 }));
  tweens.push(
    animate(
      view.endCardTitle,
      { opacity: [0, 1], scale: [0.9, 1], y: [18, 0] },
      { delay: 0.08, duration: 0.35 },
    ),
  );
  tweens.push(
    animate(
      view.ctaButton,
      { opacity: [0, 1], scale: [0.86, 1], y: [14, 0] },
      { delay: 0.18, duration: 0.32, onComplete: startButtonBreathing },
    ),
  );
  tweens.push(
    animate(
      view.ctaShine,
      { x: ['-200%', '600%'] },
      {
        delay: 0.55,
        duration: 0.72,
        ease: 'easeInOut',
        repeat: attentionRepeats,
        repeatDelay: 1.68,
      },
    ),
  );

  return () => {
    for (const tween of tweens) {
      tween.cancel();
    }
  };

  /** Hand scale over after entrance finishes; two animations must not own it together. */
  function startButtonBreathing(): void {
    tweens.push(
      animate(
        view.ctaButton,
        { scale: [1, 1.045, 1] },
        {
          delay: 0.15,
          duration: 1.8,
          ease: 'easeInOut',
          repeat: attentionRepeats,
          repeatDelay: 0.15,
        },
      ),
    );
  }
}
