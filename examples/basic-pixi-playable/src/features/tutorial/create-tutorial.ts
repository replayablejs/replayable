import { playable } from '@replayablejs/runtime';

import type { Tutorial } from '../../types/tutorial';
import { createTutorialScroll } from './create-tutorial-scroll';

/** Owns optional guidance: show once after board entrance, then dismiss by tap or timeout. */
export function createTutorial(): Tutorial | undefined {
  const { tutorial, tutorialDuration } = playable.config.params;

  if (!tutorial) {
    return undefined;
  }

  if (typeof tutorialDuration !== 'number') {
    throw new Error('Tutorial requires a numeric duration.');
  }

  // Capture the validated number for the deferred show callback.
  const duration = tutorialDuration;
  const scroll = createTutorialScroll();
  let shown = false;
  let dismissed = false;

  return { container: scroll.container, show, dismiss, destroy };

  /** Board entrance completion opens the scroll; rotation never restarts it. */
  async function show(): Promise<void> {
    if (shown || dismissed) {
      return;
    }
    shown = true;
    scroll.open();
    // Start counting when shown, not while waiting for the board entrance.
    // A late timeout is inert after dismissal or destruction.
    await playable.timers.delay(duration);
    dismiss();
  }

  /** Early taps cancel pending guidance; visible guidance closes only once. */
  function dismiss(): void {
    if (dismissed) {
      return;
    }
    dismissed = true;
    if (shown) {
      scroll.close();
    }
  }

  /** Invalidate the pending timeout before releasing presentation resources. */
  function destroy(): void {
    dismissed = true;
    scroll.destroy();
  }
}
