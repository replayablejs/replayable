import type { EndCardTrigger } from '#types/end-card-trigger.js';

import { installDevtoolsInteraction } from '../interaction/install-devtools-interaction.js';

import styles from './skip-button.css?inline';

/** DOM-only control, independent of stats, canvas, and the renderer. */
export function createSkipButton(onSkip: () => void): EndCardTrigger {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'replayable-skip';
  const arrow = document.createElement('span');
  arrow.className = 'replayable-skip__arrow';
  arrow.setAttribute('aria-hidden', 'true');
  button.append(arrow);
  button.title = 'Skip to endcard (Escape)';
  button.setAttribute('aria-label', 'Skip to endcard');
  button.setAttribute('role', 'button');
  const style = document.createElement('style');
  style.textContent = styles;
  document.head.append(style);
  document.body.append(button);
  const removeInteraction = installDevtoolsInteraction(button, onSkip);

  return { destroy };

  /** Remove capture listeners before detaching their target. */
  function destroy(): void {
    removeInteraction();
    button.remove();
    style.remove();
  }
}
