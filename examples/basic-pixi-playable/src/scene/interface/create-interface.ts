import { createLayout } from '@replayablejs/pixi';
import { playable } from '@replayablejs/runtime';
import { Container } from 'pixi.js';

import { createPersistentCta } from '../../features/controls/create-persistent-cta';
import type { EndCard } from '../../types/end-card';
import type { SceneInterface } from '../../types/interface';
import { createInterfaceLayoutConfig } from './configs/interface-layout';
import { createLogo } from './create-logo';
import { createLogoMovement } from './create-logo-movement';

/**
 * Keeps branding above both gameplay and the endcard's click shield.
 * Reads the endcard's placement; the main scene still owns its lifecycle.
 */
export function createInterface(endCard: EndCard): SceneInterface {
  const container = new Container({ label: 'interface' });
  const logo = createLogo();
  const persistentCta = createPersistentCta();
  const layout = createLayout(createInterfaceLayoutConfig(endCard.popupTop));

  layout.container.label = 'interface-layout';
  layout.attach('logo', logo.container);

  if (persistentCta !== undefined) {
    layout.attach('persistentCta', persistentCta.container);
  }

  container.addChild(layout.container);

  const logoMovement = createLogoMovement(layout, logo.container);

  // Main scene creates the endcard first, so its resize listener runs before
  // ours. Read the live resting position, never a captured pre-rotation value.
  const removeResizeListener = playable.on('resize', resize);
  const removeCompletionListener = playable.on('complete', handleCompletion);

  return { container, moveLogoToEndCard: logoMovement.moveToEndCard, destroy };

  /** Retire the gameplay CTA immediately; branding remains visible. */
  function handleCompletion(): void {
    persistentCta?.hide();
  }

  /** Layout retains the logo's current area; rotation cancels only its in-flight movement. */
  function resize(): void {
    logoMovement.stop();
    layout.update(createInterfaceLayoutConfig(endCard.popupTop));
    // Rotation places the logo directly at its new destination, finishing the move.
    logoMovement.finish();
  }

  /** Releases animations and controls without destroying shared atlas textures. */
  function destroy(): void {
    removeResizeListener();
    removeCompletionListener();
    logoMovement.destroy();
    logo.destroy();
    persistentCta?.destroy();
    layout.destroy();
    container.destroy({ children: true });
  }
}
