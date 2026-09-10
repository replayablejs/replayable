import { playable } from '@replayablejs/runtime';
import type { Container, FederatedPointerEvent } from 'pixi.js';

/**
 * Keeps hints suspended for the entire press, not merely at the moment of a tap.
 * Resetting an inactivity timer on pointerdown alone would let it expire while the
 * player is still holding a finger down. Instead, begin suspends hints immediately
 * and end permits a fresh inactivity window after the last tracked finger releases.
 *
 * Observe the main scene so cards, empty gameplay space, and sibling controls share
 * the same behavior. The caller supplies an interactive ancestor of those objects;
 * this helper neither changes its hit area nor intercepts/stops gameplay input.
 *
 * Pixi owns presses/releases. Native cancellation fills its missing cancel path.
 * Replayable owns visibility and orientation changes.
 * This helper only connects those events to hint behavior; it owns no timer or artwork.
 *
 * @param root - Interactive scene ancestor whose descendants receive player input.
 * @param begin - Suspend the hint timer and cancel any visible hand animation.
 * @param end - Allow the owner to restart inactivity, subject to its visibility/stopped guards.
 * @returns Cleanup for exactly the listeners installed here; it does not call begin or end.
 */
export function installHintInteraction(
  root: Container,
  begin: () => void,
  end: () => void,
): () => void {
  // Track each finger independently. Releasing one finger must not resume hints
  // while another is held. Pointer IDs also let us ignore unrelated/duplicate releases.
  const pointers = new Set<number>();
  // Ordinary resizing must preserve held fingers; only an orientation change retires them.
  let orientation = playable.screen.orientation;

  // Capture runs down the scene tree before the card/control receives the event.
  // A child calling stopPropagation during its own handler cannot hide this press/release.
  root.on('pointerdowncapture', handleDown);
  root.on('pointerupcapture', handleEnd);
  // A release outside the pressed object may not reach root as pointerup.
  // Pixi sends pointerupoutside along the original press path, without a capture phase.
  root.on('pointerupoutside', handleEnd);

  // Pixi 8.20.1 does not forward cancellation. Match its input mode: modern
  // browsers use PointerEvent IDs; its TouchEvent fallback uses touch identifiers.
  // Listen on the borrowed DOM container without changing or cancelling the event.
  const inputContainer = playable.container;
  const usesPointerEvents = typeof window.PointerEvent !== 'undefined';
  if (usesPointerEvents) {
    inputContainer.addEventListener('pointercancel', handlePointerCancel, true);
  } else {
    inputContainer.addEventListener('touchcancel', handleTouchCancel, true);
  }

  // Observe playable lifecycle independently of pointer input. Hiding or rotating
  // retires tracked presses; these events are not notifications of pointer cancellation.
  const removeVisibilityListener = playable.on('visibilitychange', handleVisibilityChange);
  const removeResizeListener = playable.on('resize', handleResize);

  return remove;

  /**
   * Suspend immediately, before a card reveals or a control handles the press.
   * Calling begin for each additional finger is safe: the owner's stop/cancel operations
   * are repeatable. No synthetic click or card interaction is dispatched here.
   */
  function handleDown(event: FederatedPointerEvent): void {
    pointers.add(event.pointerId);
    begin();
  }

  /**
   * Finish only a press we observed, and only after every tracked finger is released.
   * Both inside and outside releases use this handler. Set.delete returning false means
   * the pointer was unrelated, already released, or cleared by a lifecycle change.
   */
  function handleEnd(event: FederatedPointerEvent): void {
    finishPointer(event.pointerId);
  }

  /** Native PointerEvent IDs match Pixi's IDs when pointer events are supported. */
  function handlePointerCancel(event: PointerEvent): void {
    finishPointer(event.pointerId);
  }

  /** Older browsers use Touch identifiers, not synthetic PointerEvent IDs. */
  function handleTouchCancel(event: TouchEvent): void {
    for (const touch of Array.from(event.changedTouches)) {
      finishPointer(touch.identifier);
    }
  }

  /** Ignore unrelated/duplicate cancellations and preserve other held fingers. */
  function finishPointer(pointerId: number): void {
    if (pointers.delete(pointerId) && pointers.size === 0) {
      end();
    }
  }

  /**
   * Hidden WebViews may never deliver the releases for fingers held before hiding.
   * Discard those IDs and suspend the hint. On becoming visible, ask the owner to start
   * a fresh inactivity window rather than continuing a partially elapsed one.
   * These callbacks describe hint suspension/resumption, not literal pointer events.
   */
  function handleVisibilityChange(visible: boolean): void {
    if (visible) {
      end();
    } else {
      pointers.clear();
      begin();
    }
  }

  /**
   * Rotation can abandon a pointer without a matching release event.
   * Retire the old gesture, cancel the old route, then request a fresh inactivity window.
   * begin must precede end: cancel first, restart second.
   *
   * A same-orientation resize must not release a finger that is genuinely still held.
   * Repositioning the hand after layout changes belongs to the hint's resize method,
   * not this input observer. The owner also prevents restarting while hidden/stopped.
   */
  function handleResize(): void {
    const nextOrientation = playable.screen.orientation;
    if (nextOrientation === orientation) {
      return;
    }
    orientation = nextOrientation;
    pointers.clear();
    begin();
    end();
  }

  /**
   * Unsubscribe using the same event names and function references used at installation.
   * Do not remove other scene listeners, destroy the borrowed root, or resume hints.
   * The owner calls this when guidance stops permanently, then handles its timer/artwork.
   */
  function remove(): void {
    root.off('pointerdowncapture', handleDown);
    root.off('pointerupcapture', handleEnd);
    root.off('pointerupoutside', handleEnd);
    inputContainer.removeEventListener('pointercancel', handlePointerCancel, true);
    inputContainer.removeEventListener('touchcancel', handleTouchCancel, true);
    removeVisibilityListener();
    removeResizeListener();
    pointers.clear();
  }
}
