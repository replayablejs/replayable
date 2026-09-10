import { createButton } from '@replayablejs/pixi';
import { animate, type TweenPlaybackControls } from '@replayablejs/tween';
import type { Container } from 'pixi.js';

import type { Control } from '../../types/control';

/** Adds the example's tap pulse and hide behavior to the shared Pixi button. */
export function createControlButton(content: Container, activate: () => void): Control {
  const button = createButton({ content, onActivate: handleTap });
  const container = button.container;
  const restingScale = { x: content.scale.x, y: content.scale.y };
  let pulse: TweenPlaybackControls | undefined;

  return { container, hide, destroy };

  /** Calls the action synchronously, retaining the browser's trusted input context. */
  function handleTap(): void {
    stopPulse();
    pulse = animate(
      content.scale,
      {
        x: [restingScale.x, restingScale.x * 0.94, restingScale.x],
        y: [restingScale.y, restingScale.y * 0.94, restingScale.y],
      },
      { duration: 0.18 },
    );
    activate();
  }

  /** Reset before another press or teardown; repeated taps never compound the scale. */
  function stopPulse(): void {
    pulse?.stop();
    pulse = undefined;
    content.scale.copyFrom(restingScale);
  }

  /** No removal or relayout: completion must not cause the board to change size. */
  function hide(): void {
    button.setEnabled(false);
    container.visible = false;
    stopPulse();
  }

  function destroy(): void {
    hide();
    button.destroy();
  }
}
