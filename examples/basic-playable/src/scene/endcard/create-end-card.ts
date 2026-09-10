import { playable } from '@replayablejs/runtime';

import { addButtonLabel } from '../../features/controls/add-button-label';
import type { EndCard, EndCardMessage } from '../../types/end-card';
import { animateEndCard } from './animate-end-card';

/** Owns the terminal presentation and the active network's clickable endcard area. */
export function createEndCard(): EndCard {
  const container = document.createElement('section');
  const title = document.createElement('h2');
  const button = document.createElement('button');
  const shine = document.createElement('span');
  container.className = 'end-card';
  container.hidden = true;
  container.ariaLive = 'polite';
  title.textContent = playable.localization.translate('success');
  button.className = 'cta-button';
  button.type = 'button';
  const removeLabel = addButtonLabel(button, playable.localization.translate('playNow'));
  shine.className = 'cta-shine';
  shine.ariaHidden = 'true';
  button.append(shine);
  container.append(title, button);
  container.addEventListener('pointerup', handlePointerUp);
  let stopAnimation: (() => void) | undefined;

  return { container, show, destroy };

  /** CSS starts the elements transparent so unhiding never flashes the final pose. */
  function show(message: EndCardMessage): void {
    stopAnimation?.();
    title.textContent = playable.localization.translate(message);
    container.hidden = false;
    stopAnimation = animateEndCard(
      {
        endCard: container,
        endCardTitle: title,
        ctaButton: button,
        ctaShine: shine,
      },
      playable.config.endCard.animation,
    );
  }

  /** Restricted networks allow the button only; others also allow the backdrop. */
  function handlePointerUp(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) {
      return;
    }
    const clickedCta = event.composedPath().includes(button);
    if (playable.config.endCard.interaction === 'cta-only' && !clickedCta) {
      return;
    }
    playable.openStore();
  }

  /** Stop repeating attention before removing its target elements. */
  function destroy(): void {
    stopAnimation?.();
    container.removeEventListener('pointerup', handlePointerUp);
    removeLabel();
  }
}
