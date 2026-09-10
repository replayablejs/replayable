import { playable } from '@replayablejs/runtime';
import type { Container } from 'pixi.js';

import type { Board } from '../../types/board';
import type { Hint } from '../../types/hint';
import { createHintHand } from './create-hint-hand';
import { installHintInteraction } from './install-hint-interaction';

/** Owns inactivity and a non-interactive hand, querying the board only when needed. */
export function createHint(board: Board, inputRoot: Container): Hint | undefined {
  const { hint, hintDelay } = playable.config.params;
  if (!hint) {
    return undefined;
  }
  if (typeof hintDelay !== 'number') {
    throw new Error('Hint requires a numeric inactivity delay.');
  }

  const hand = createHintHand();
  const timer = playable.timers.createInactivityTimer({ duration: hintDelay, onTimeout: show });
  let stopped = false;
  const removeInteraction = installHintInteraction(inputRoot, beginInteraction, endInteraction);
  timer.start();

  return { container: hand.container, resize, stop, destroy };

  /** Visits unopened cards in board order, then leaves a full inactivity gap. */
  function show(): void {
    if (stopped) {
      return;
    }
    const candidates = board.getUnopenedCards();
    if (candidates.length === 0) {
      return;
    }
    hand.show(candidates, handleSequenceComplete);
  }

  /** Refit invalidates an active route; hidden hints must not interrupt held input. */
  function resize(): void {
    if (!hand.visible) {
      return;
    }
    timer.stop();
    hand.cancel();
    restartDelay();
  }

  /** The next delay starts after the hand disappears, not while it is demonstrating. */
  function handleSequenceComplete(): void {
    restartDelay();
  }

  /** Stops the clock and gesture; activity alone cannot protect a held pointer. */
  function beginInteraction(): void {
    timer.stop();
    hand.cancel();
  }

  function endInteraction(): void {
    restartDelay();
  }

  /** Hidden or permanently stopped hints never start another inactivity window. */
  function restartDelay(): void {
    if (!stopped && playable.state.visible) {
      timer.restart();
    }
  }

  /** Completion permanently retires both input observation and visual guidance. */
  function stop(): void {
    stopped = true;
    removeInteraction();
    timer.stop();
    hand.cancel();
  }

  function destroy(): void {
    stop();
    hand.destroy();
  }
}
