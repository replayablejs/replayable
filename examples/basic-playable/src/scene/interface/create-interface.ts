import { playable } from '@replayablejs/runtime';
import { animate, type TweenPlaybackControls } from '@replayablejs/tween';

import { addButtonLabel } from '../../features/controls/add-button-label';
import type { GameInterface } from '../../types/interface';

/** Creates persistent branding and CTA as direct children of the scene's CSS grid. */
export function createInterface(): GameInterface {
  const { persistentCtaLabel } = playable.config.params;
  if (typeof persistentCtaLabel !== 'string') {
    throw new Error('Word Garden requires the string persistentCtaLabel parameter.');
  }

  const header = document.createElement('header');
  const title = document.createElement('h1');
  const instruction = document.createElement('p');
  header.className = 'game-header';
  // Artwork supplies the visible logo; localization supplies its accessible name.
  title.ariaLabel = playable.localization.translate('title');
  instruction.textContent = playable.localization.translate('instruction');
  header.append(title, instruction);

  const persistentCta = document.createElement('button');
  persistentCta.className = 'persistent-cta';
  persistentCta.type = 'button';
  persistentCta.hidden = !playable.config.controls.persistentCta;
  const removeLabel = addButtonLabel(
    persistentCta,
    playable.localization.translate(persistentCtaLabel),
  );
  persistentCta.addEventListener('pointerup', handleStorePointerUp);
  let entrance: TweenPlaybackControls | undefined;

  return { header, persistentCta, show, showEndCard, destroy };

  /** Introduces branding independently of the gameplay's panel entrance. */
  function show(): void {
    entrance?.cancel();
    entrance = animate(header, { opacity: [0, 1], y: [-20, 0] }, { duration: 0.35 });
  }

  /** The endcard owns its own CTA; do not leave the persistent button behind it. */
  function showEndCard(): void {
    persistentCta.hidden = true;
  }

  /** Let the network adapter handle the actual destination and click API. */
  function handleStorePointerUp(event: PointerEvent): void {
    if (event.isPrimary && event.button === 0) {
      playable.openStore();
    }
  }

  /** Release interaction, text fitting, and the optional entrance animation. */
  function destroy(): void {
    entrance?.cancel();
    persistentCta.removeEventListener('pointerup', handleStorePointerUp);
    removeLabel();
  }
}
