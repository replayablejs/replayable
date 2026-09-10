import { playable } from '@replayablejs/runtime';

import type { WordGardenHint } from '../../types/hint';

/**
 * Suspends hint inactivity while any pointer is held, before wheel selection runs.
 * Releases are observed outside the root too. Runtime resize/visibility changes
 * retire abandoned presses that a host may interrupt without a pointer release.
 */
export function installHintInteraction(root: HTMLElement, hint: WordGardenHint): () => void {
  const activePointerIds = new Set<number>();
  const removeResizeListener = playable.on('resize', resetInteraction);
  const removeVisibilityListener = playable.on('visibilitychange', resetInteraction);
  root.addEventListener('pointerdown', handleDown, { capture: true });
  window.addEventListener('pointerup', handleEnd, { capture: true });
  window.addEventListener('pointercancel', handleEnd, { capture: true });
  return destroy;

  /** The same down event must cancel a preview before reaching a letter button. */
  function handleDown(event: PointerEvent): void {
    if (activePointerIds.size === 0) {
      hint.beginInteraction();
    }
    activePointerIds.add(event.pointerId);
  }

  /** Only the final released pointer permits another inactivity window. */
  function handleEnd(event: PointerEvent): void {
    if (!activePointerIds.delete(event.pointerId) || activePointerIds.size > 0) {
      return;
    }
    hint.endInteraction();
  }

  /** Returning to a visible scene starts a fresh window, never a stale preview. */
  function resetInteraction(): void {
    activePointerIds.clear();
    hint.beginInteraction();
    if (playable.state.visible) {
      hint.endInteraction();
    }
  }

  /** Removes this feature's subscriptions without affecting normal wheel input. */
  function destroy(): void {
    removeResizeListener();
    removeVisibilityListener();
    root.removeEventListener('pointerdown', handleDown, { capture: true });
    window.removeEventListener('pointerup', handleEnd, { capture: true });
    window.removeEventListener('pointercancel', handleEnd, { capture: true });
    activePointerIds.clear();
  }
}
