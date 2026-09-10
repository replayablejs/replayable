import type { ReplayableLayout } from '@replayablejs/pixi';
import { animate, type TweenPlaybackControls } from '@replayablejs/tween';
import type { Container } from 'pixi.js';

import type { LogoMovement } from '../../types/logo';

/** Bridges the logo's two layout areas without owning its artwork or placement containers. */
export function createLogoMovement(layout: ReplayableLayout, logo: Container): LogoMovement {
  let animation: TweenPlaybackControls | undefined;
  let movement: Promise<void> | undefined;
  let resolveMovement: (() => void) | undefined;
  let rejectMovement: ((reason: DOMException) => void) | undefined;
  let destroyed = false;

  return { moveToEndCard, stop, finish, destroy };

  /** Repeated calls share one transition; a destroyed interface cannot start another. */
  function moveToEndCard(): Promise<void> {
    if (destroyed) {
      return Promise.reject(new DOMException('Interface was destroyed.', 'AbortError'));
    }
    movement ??= new Promise<void>(start);
    return movement;
  }

  /** Let layout resolve the destination, then animate there from the previous pose. */
  function start(resolve: () => void, reject: (reason: DOMException) => void): void {
    resolveMovement = resolve;
    rejectMovement = reject;
    const fromX = logo.x;
    const fromY = logo.y;
    const fromScaleX = logo.scale.x;
    const fromScaleY = logo.scale.y;

    // Change attachment first so later resizes retain the destination area.
    layout.move(logo, 'logoEndCard');
    const toX = logo.x;
    const toY = logo.y;
    const toScaleX = logo.scale.x;
    const toScaleY = logo.scale.y;
    logo.position.set(fromX, fromY);
    logo.scale.set(fromScaleX, fromScaleY);

    animation = animate(
      [
        [logo, { x: [fromX, toX], y: [fromY, toY] }, { duration: 0.2, ease: 'easeOut' }],
        [
          logo.scale,
          { x: [fromScaleX, toScaleX], y: [fromScaleY, toScaleY] },
          { at: 0, duration: 0.2, ease: 'easeOut' },
        ],
      ],
      { onComplete: finish },
    );
  }

  /** Stop writing transforms before resize applies the new destination; do not settle yet. */
  function stop(): void {
    animation?.stop();
    animation = undefined;
  }

  /** Resolve after animation completes, or after resize has placed the logo at its destination. */
  function finish(): void {
    if (destroyed) {
      return;
    }
    resolveMovement?.();
    resolveMovement = undefined;
    rejectMovement = undefined;
  }

  /** Destruction cancels rather than completing the scene's pending transition. */
  function destroy(): void {
    destroyed = true;
    stop();
    rejectMovement?.(new DOMException('Interface was destroyed.', 'AbortError'));
    resolveMovement = undefined;
    rejectMovement = undefined;
  }
}
