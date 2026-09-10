import { createSprite } from '@replayablejs/pixi';
import { animate } from '@replayablejs/tween';
import { Container, Rectangle } from 'pixi.js';

import { atlases } from '../../assets/registries';
import type { SceneLogo } from '../../types/logo';

/** Gives the logo one quiet entrance without animating layout-owned transforms. */
export function createLogo(): SceneLogo {
  const container = new Container({ label: 'logo', eventMode: 'none' });
  const artwork = createSprite({ texture: atlases.ui.logo, eventMode: 'none' });
  const bounds = artwork.getLocalBounds();
  container.boundsArea = new Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  container.addChild(artwork);

  artwork.alpha = 0;
  artwork.scale.set(0.95);
  const entrance = animate([
    [artwork, { alpha: [0, 1] }, { duration: 0.3, ease: 'easeOut' }],
    [artwork.scale, { x: [0.95, 1], y: [0.95, 1] }, { at: 0, duration: 0.4, ease: 'easeOut' }],
  ]);

  return { container, destroy };

  /** Stop Motion before releasing the artwork; the shared atlas remains loaded. */
  function destroy(): void {
    entrance.stop();
    container.destroy({ children: true });
  }
}
