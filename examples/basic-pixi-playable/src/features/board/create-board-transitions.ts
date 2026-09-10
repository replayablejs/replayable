import type { BoardTransitions } from '../../types/board';
import type { Card } from '../../types/card';

/** Coordinates forward entrances and reverse exits; cards own the actual animations. */
export function createBoardTransitions(cards: readonly Card[]): BoardTransitions {
  let shown = false;
  let destroyed = false;
  let completion: Promise<void> | undefined;
  let rejectCompletion: ((reason: DOMException) => void) | undefined;

  return { show, hide, destroy };

  /** Start entrances only after the board is mounted, and report once all have settled. */
  function show(onComplete: () => void): void {
    if (shown || destroyed || completion !== undefined) {
      return;
    }
    shown = true;
    let remaining = cards.length;
    if (remaining === 0) {
      onComplete();
      return;
    }
    for (const [index, card] of cards.entries()) {
      // A completion callback may synchronously destroy the scene.
      if (destroyed) {
        return;
      }
      card.show(index * 0.1, handleCardShown);
    }

    /** Explicitly settled entrances count just like natural completion. */
    function handleCardShown(): void {
      remaining -= 1;
      if (!destroyed && remaining === 0) {
        onComplete();
      }
    }
  }

  /** Repeated calls share one exit. Never return a successful old wait after destruction. */
  function hide(): Promise<void> {
    if (destroyed) {
      return Promise.reject(new DOMException('Board was destroyed.', 'AbortError'));
    }
    completion ??= new Promise<void>(animateCards);
    return completion;
  }

  /** Count actual card completions, not estimated animation durations. */
  function animateCards(resolve: () => void, reject: (reason: DOMException) => void): void {
    rejectCompletion = reject;
    let remaining = cards.length;
    if (remaining === 0) {
      resolve();
      return;
    }

    // Last card entered last, so it leaves first. For two cards: delays 0.1s, 0s.
    for (const [index, card] of cards.entries()) {
      card.hide((cards.length - 1 - index) * 0.1, handleCardHidden);
    }

    /** The scene may continue only after every card has finished its exit. */
    function handleCardHidden(): void {
      remaining -= 1;
      if (remaining === 0) {
        resolve();
      }
    }
  }

  /** Cancel the pending scene transition before the board destroys its cards. */
  function destroy(): void {
    destroyed = true;
    rejectCompletion?.(new DOMException('Board was destroyed.', 'AbortError'));
  }
}
