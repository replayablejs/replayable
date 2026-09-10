import { createSpine } from '@replayablejs/pixi/spine';
import { Container, Rectangle } from 'pixi.js';

import { spines } from '../../assets/registries';
import type { CardView } from '../../types/card';

/** Constructs the card's initial pose and stable layout box without playing an entrance. */
export function createCardView(): CardView {
  const container = new Container({ label: 'card', eventMode: 'none' });
  const spine = createSpine({ skeleton: spines.card.skeleton, defaultMix: 0 });

  spine.eventMode = 'none';
  spine.state.setAnimation(0, spines.card.animations.card_back, false);
  // Apply the initial pose before measuring it; this advances no game time.
  spine.update(0);
  container.addChild(spine);

  // A flip collapses to a thin edge and its front adds glow. Layout and input
  // retain the original rectangle instead of following those animated bounds.
  // This rectangle is a sizing reference, not a clip for the artwork.
  const measured = spine.getLocalBounds();
  const bounds = new Rectangle(measured.x, measured.y, measured.width, measured.height);
  container.boundsArea = bounds;
  container.hitArea = bounds;

  // Animate Spine's outer transform directly; its bones still own the flip.
  // Matching position and pivot preserves the resting pose while allowing a
  // centered scale overshoot, without an extra artwork container.
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  spine.pivot.set(centerX, centerY);
  spine.position.set(centerX, centerY);

  return { container, spine, bounds };
}
