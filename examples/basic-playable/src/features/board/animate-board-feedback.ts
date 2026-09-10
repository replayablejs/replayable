import { animate, stagger, type TweenPlaybackControls } from '@replayablejs/tween';

import type { RejectionClass } from '../../types/board';
const rejectedWordTweens = new WeakMap<HTMLElement, TweenPlaybackControls>();

/** Grows newly solved cells into place; already revealed intersections are omitted. */
export function animateAcceptedWord(cells: readonly HTMLElement[]): void {
  if (cells.length === 0) {
    return;
  }

  animate(
    [...cells],
    { opacity: [0.55, 1], scale: [0.7, 1], y: [8, 0] },
    { delay: stagger(0.045), duration: 0.28 },
  );
}

/** Briefly emphasizes the progress meter after an accepted answer. */
export function animateProgress(progress: HTMLProgressElement): void {
  animate(progress, { scale: [1, 1.07, 1] }, { duration: 0.3 });
}

/** Shakes an invalid or repeated selection and restores its neutral appearance. */
export function animateRejectedWord(
  output: HTMLOutputElement,
  feedbackClass: RejectionClass,
): void {
  rejectedWordTweens.get(output)?.cancel();
  output.classList.remove('is-invalid', 'is-already-found');
  output.classList.add(feedbackClass);

  const tween = animate(output, { x: [0, -7, 7, -4, 4, 0] }, { duration: 0.32 });

  rejectedWordTweens.set(output, tween);

  function clearCurrentFeedback(): void {
    if (rejectedWordTweens.get(output) === tween) {
      rejectedWordTweens.delete(output);
      output.classList.remove(feedbackClass);
    }
  }

  void tween.then(clearCurrentFeedback, clearCurrentFeedback);
}
