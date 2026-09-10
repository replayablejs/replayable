import { createLayout } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';
import { Container, Rectangle, type FederatedPointerEvent } from 'pixi.js';

import type { EndCard } from '../../types/end-card';
import { createEndCardLayoutConfig } from './configs/end-card-layout';
import { createEndCardButton } from './create-end-card-button';
import { createEndCardEntrance } from './create-end-card-entrance';
import { createRatingPanel } from './create-rating-panel';

/** Owns terminal artwork and input policy, not gameplay or completion timers. */
export function createEndCard(): EndCard {
  const container = new Container({
    label: 'endcard',
    visible: false,
    eventMode: 'static',
    hitArea: new Rectangle(0, 0, playable.screen.frame.width, playable.screen.frame.height),
  });
  const layout = createLayout(createEndCardLayoutConfig());
  const rating = createRatingPanel();
  const button = createEndCardButton();
  const ratingPlacement = createArtworkPlacement(rating, 'rating-placement');
  const buttonPlacement = createArtworkPlacement(button.container, 'button-placement');

  layout.container.label = 'endcard-layout';
  layout.attach('rating', ratingPlacement);
  layout.attach('button', buttonPlacement);
  container.addChild(layout.container);

  const entrance = createEndCardEntrance(rating, button);
  container.on('pointertap', handleBackdropTap);
  const removeResizeListener = playable.on('resize', resize);

  return {
    container,
    get popupTop(): number {
      const popupBounds = ratingPlacement.getLocalBounds();
      return container.toLocal({ x: popupBounds.x, y: popupBounds.y }, ratingPlacement).y;
    },
    show,
    destroy,
  };

  /** Prepare the hidden pose before revealing; entrance owns the shared completion wait. */
  function show(): Promise<void> {
    const shown = entrance.show();
    if (!container.destroyed) {
      container.visible = true;
    }
    return shown;
  }

  /** Keep the input shield full-frame while rating and CTA use safe content bounds. */
  function resize(): void {
    layout.update(createEndCardLayoutConfig());
    container.hitArea = new Rectangle(
      0,
      0,
      playable.screen.frame.width,
      playable.screen.frame.height,
    );
  }

  /** CTA-only networks still consume backdrop taps so input cannot reach the finished game. */
  function handleBackdropTap(event: FederatedPointerEvent): void {
    event.stopPropagation();
    if (
      event.isPrimary &&
      event.button === 0 &&
      playable.config.endCard.interaction === 'full-screen'
    ) {
      playable.openStore();
    }
  }

  /** Release animations and owned objects before the placement container. */
  function destroy(): void {
    removeResizeListener();
    container.off('pointertap', handleBackdropTap);
    entrance.destroy();
    button.destroy();
    rating.destroy({ children: true });
    layout.destroy();
    ratingPlacement.destroy();
    buttonPlacement.destroy();
    container.destroy();
  }
}

/** Layout measures the resting box while centered artwork animates independently inside it. */
function createArtworkPlacement(artwork: Container, label: string): Container {
  const placement = new Container({ label });
  const bounds = artwork.getLocalBounds();
  placement.boundsArea = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  // Matching pivot and position preserves the resting pose and centers animated scaling.
  artwork.pivot.set(centerX, centerY);
  artwork.position.set(centerX, centerY);
  placement.addChild(artwork);
  return placement;
}
