import { playable } from '@replayablejs/runtime';
import { animate, type TweenPlaybackControls } from '@replayablejs/tween';

import { createControlButton } from '../../features/controls/create-control-button';
import type { EndCardButton } from '../../types/end-card';
import { createEndCardButtonContent } from './create-end-card-button-content';

/** Owns CTA input and attention; entrance hands this same transform over after finishing. */
export function createEndCardButton(): EndCardButton {
  const content = createEndCardButtonContent();
  const button = createControlButton(content, openStore);
  const container = button.container;
  container.label = 'endcard-button';
  let attention: TweenPlaybackControls | undefined;

  return { container, playAttention, destroy };

  /**
   * Entrance finishes at scale 1 before starting attention on this same container.
   * Layout owns the external placement wrapper; press feedback scales the child artwork.
   */
  function playAttention(): void {
    attention?.stop();
    attention = animate(
      button.container.scale,
      { x: [1, 1.04, 1], y: [1, 1.04, 1] },
      {
        duration: 1.4,
        repeat: playable.config.endCard.animation === 'continuous' ? Infinity : 0,
        ease: 'easeInOut',
      },
    );
  }

  /** The shared control stops bubbling before this call, preventing a second backdrop exit. */
  function openStore(): void {
    playable.openStore();
  }

  function destroy(): void {
    attention?.stop();
    button.destroy();
  }
}
