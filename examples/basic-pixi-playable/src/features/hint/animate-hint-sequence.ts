import { animate, type TweenPlaybackControls } from '@replayablejs/tween';
import type { Container, Sprite } from 'pixi.js';

import type { BoardCard } from '../../types/board';
import type { HintTargetPlacement } from '../../types/hint';

/** Entrance/exit travel on each axis, expressed as a fraction of the scaled hand width. */
const HAND_TRAVEL_RATIO = 0.12;

/**
 * Plays one visual hint cycle: approach the first card, tap each remaining card, then retreat.
 * The taps are animation only: this function never dispatches input or reveals a card.
 *
 * The outer container owns travel and card-relative sizing. The hand sprite owns the
 * tap pulse and opacity, so shrinking the finger does not change its travel coordinates.
 *
 * This function starts immediately and expects a mounted hand and a non-empty card list.
 * Its owner handles inactivity, input cancellation, rotation, and resetting/hiding the hand.
 * A natural finish calls onComplete; cancellation is silent and must not restart inactivity.
 *
 * @returns A cancellation function for the current cycle, not a repeating timer.
 */
export function animateHintSequence(
  container: Container,
  hand: Sprite,
  cards: readonly BoardCard[],
  onComplete: () => void,
): () => void {
  // Consume our own ordered queue without modifying the board's supplied array.
  // Card objects remain live, allowing us to skip cards revealed during this cycle.
  const pending = [...cards];
  // Only one visit or retreat runs at a time; cancellation always targets that animation.
  let animation: TweenPlaybackControls | undefined;
  let stopped = false;
  // Each invocation starts a new cycle, even when the same Pixi objects are reused.
  let firstVisit = true;
  visitNext();

  return stop;

  /**
   * Coordinates one visit. Motion calls this again only after that visit's tap finishes.
   * Once the queue is exhausted, retreat completes the cycle instead of looping here.
   */
  function visitNext(): void {
    if (stopped) {
      return;
    }
    const parent = container.parent;
    // Detached hands have no destination coordinate space. Stop without reporting completion.
    if (parent === null) {
      stop();
      return;
    }
    const target = takeNextUnopenedCard();
    if (target === undefined) {
      retreat();
      return;
    }

    const placement = resolveTargetPlacement(target, parent);
    prepareFirstVisit(placement);
    animateVisit(placement);
  }

  /**
   * Takes the next still-unopened card in the original order.
   * Both revealing and already-revealed cards are skipped; only the 'back' state is eligible.
   * Consuming skipped entries ensures each supplied card is considered at most once per cycle.
   */
  function takeNextUnopenedCard(): BoardCard | undefined {
    let target = pending.shift();
    while (target !== undefined && target.state !== 'back') {
      target = pending.shift();
    }
    return target;
  }

  /**
   * Resolves the card center into the hand container's parent coordinates.
   * Card-local coordinates cannot be assigned directly because the board has its own layout
   * transforms. toLocal converts from the card's space through those transforms for us.
   *
   * Sizing uses 45% of the card's world bounding width divided by the original texture width.
   * This relies on the hint parent's current unscaled scene-coordinate space; it is not a
   * general sizing conversion for an arbitrarily scaled hint parent.
   */
  function resolveTargetPlacement(target: BoardCard, parent: Container): HintTargetPlacement {
    const bounds = target.container.getLocalBounds();
    const position = parent.toLocal(
      { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
      target.container,
    );
    const scale = (target.container.getBounds().width * 0.45) / hand.texture.orig.width;

    return { position, scale };
  }

  /**
   * Establishes the first visit's invisible starting pose before any animation frame runs.
   * Start slightly down/right of the target, then approach it while fading in.
   * Later visits keep their current position and travel continuously between cards.
   *
   * Reset both transform layers: the previous cycle may have left travel on the container
   * and a partial pulse/fade on the sprite. Showing only after alpha is zero avoids a flash.
   */
  function prepareFirstVisit({ position, scale }: HintTargetPlacement): void {
    if (!firstVisit) {
      return;
    }

    const approach = hand.texture.orig.width * scale * HAND_TRAVEL_RATIO;
    container.position.set(position.x + approach, position.y + approach);
    container.scale.set(scale);
    hand.position.set(0);
    hand.scale.set(1);
    hand.alpha = 0;
    container.visible = true;
    firstVisit = false;
  }

  /**
   * Runs one 0.8-second visit. All times are seconds relative to this visit:
   * - 0.0–0.4: move to the target and match its hand scale.
   * - 0.0–0.2: fade in (later visits are already opaque).
   * - 0.4–0.8: shrink to 88% and return to 100%, suggesting a tap without sending input.
   *
   * The sprite's pulse multiplies the container's base scale; it never overwrites it.
   */
  function animateVisit({ position, scale }: HintTargetPlacement): void {
    // Explicit starting keyframes also reset Motion's retained object values.
    // Setting Pixi's position alone does not invalidate the previous cycle's tween.
    animation = animate(
      [
        [
          container,
          { x: [container.x, position.x], y: [container.y, position.y] },
          { duration: 0.4, ease: 'easeInOut' },
        ],
        [
          container.scale,
          { x: [container.scale.x, scale], y: [container.scale.y, scale] },
          { at: 0, duration: 0.4, ease: 'easeInOut' },
        ],
        [hand, { alpha: [hand.alpha, 1] }, { at: 0, duration: 0.2 }],
        [
          hand.scale,
          { x: [1, 0.88, 1], y: [1, 0.88, 1] },
          { at: 0.4, duration: 0.4, ease: 'easeInOut' },
        ],
      ],
      { onComplete: visitNext },
    );
  }

  /**
   * Reverses the entrance direction from the final pose: travel down/right for 0.4 seconds,
   * fading out during 0.2–0.4. The owner hides/resets the hand after natural completion.
   * Distance follows the current scaled hand width, keeping the exit proportional to entry.
   */
  function retreat(): void {
    const distance = hand.texture.orig.width * container.scale.x * HAND_TRAVEL_RATIO;
    animation = animate(
      [
        [
          container,
          { x: [container.x, container.x + distance], y: [container.y, container.y + distance] },
          { duration: 0.4, ease: 'easeInOut' },
        ],
        [hand, { alpha: [hand.alpha, 0] }, { at: 0.2, duration: 0.2 }],
      ],
      { onComplete: finish },
    );
  }

  /**
   * Reports natural completion to the owner, which may schedule the next inactivity window.
   * A late callback after cancellation must not schedule another hint.
   */
  function finish(): void {
    if (!stopped) {
      onComplete();
    }
  }

  /**
   * Marks cancellation before stopping Motion so any completion callback sees the guard.
   * Does not call onComplete or reset Pixi properties; the owning hand handles visual cleanup.
   */
  function stop(): void {
    stopped = true;
    animation?.stop();
  }
}
