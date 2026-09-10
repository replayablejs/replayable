import { playable } from '@replayablejs/runtime';

import type { EndCardTrigger } from '#types/end-card-trigger.js';

import { createSkipButton } from './endcard-trigger/create-skip-button.js';
import { createEndCardTrigger as createDisabledTrigger } from './endcard-trigger/disabled.js';

/** Install after ready and scene creation, so skipping follows normal completion listeners. */
export function createEndCardTrigger(): EndCardTrigger {
  if (!playable.config.devtools.endCardTrigger) {
    return createDisabledTrigger();
  }
  // The state getter enforces readiness before allocating DOM or subscriptions.
  const state = playable.state;
  if (state.completion !== undefined) {
    return createDisabledTrigger();
  }

  const button = createSkipButton(skip);
  const removeCompletion = playable.on('complete', destroy);
  window.addEventListener('keydown', handleKeyDown, true);
  let destroyed = false;

  return { destroy };

  /** Normal completion owns timers, scene transitions, and host notifications. */
  function skip(): void {
    if (!destroyed && playable.state.visible) {
      playable.complete('skip');
    }
  }

  /** Ignore held keys and text editing; this shortcut must not interfere with an editor. */
  function handleKeyDown(event: KeyboardEvent): void {
    const target = event.target;
    if (
      event.key !== 'Escape' ||
      event.repeat ||
      event.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey ||
      event.shiftKey ||
      (target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('input, textarea, select') !== null))
    ) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    skip();
  }

  /** Completion removes both entry points; repeated explicit cleanup is safe. */
  function destroy(): void {
    if (destroyed) {
      return;
    }
    destroyed = true;
    window.removeEventListener('keydown', handleKeyDown, true);
    removeCompletion();
    button.destroy();
  }
}
