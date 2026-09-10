import { playable } from '@replayablejs/runtime';

import type { LetterSelection } from '../../types/input';
import type { Tutorial } from '../../types/tutorial';

/** Keeps tutorial copy and dismissal independent from word validation. */
export function createTutorial(): Tutorial {
  const { tutorial, tutorialLabel } = playable.config.params;
  if (typeof tutorial !== 'boolean' || typeof tutorialLabel !== 'string') {
    throw new Error('Word Garden requires tutorial and tutorialLabel parameters.');
  }

  const element = document.createElement('p');
  element.className = 'wheel-tutorial';
  element.textContent = playable.localization.translate(tutorialLabel);
  element.hidden = !tutorial;
  let dismissed = !tutorial;

  return { element, handleSelection };

  /** Keep occupied space after dismissal, so the wheel never jumps during play. */
  function handleSelection({ letterIds }: LetterSelection): void {
    if (dismissed || letterIds.length < 2) {
      return;
    }
    dismissed = true;
    element.classList.add('is-dismissed');
  }
}
