import { playable } from '@replayablejs/runtime';

import { locales } from '../../assets/registries/locales';
import { sprites } from '../../assets/registries/sprites';
import { animateEndCard } from './animate-end-card';
import { createCtaButton } from './create-cta-button';
import { applySafeArea, createInterfaceContainer } from './interface-layout';

/** Owns the end-card entrance, store interaction, and cleanup. The main scene shows it. */
export function createEndCard() {
  const { container, content, backdrop, button } = createEndCardElements();
  let entrance: ReturnType<typeof animateEndCard> | undefined;

  // CTA-only networks accept taps on the button; other networks accept the whole card.
  const storeTarget: HTMLElement =
    playable.config.endCard.interaction === 'cta-only' ? button : container;
  storeTarget.addEventListener('pointerup', openStore);

  playable.container.append(container);
  updateLayout();
  const removeResize = playable.on('resize', updateLayout);

  return { show, destroy };

  /** Reveal the backdrop and CTA; the gameplay UI animates its own logo. */
  function show(): void {
    container.hidden = false;

    entrance = animateEndCard({
      backdrop,
      button,
      animation: playable.config.endCard.animation,
    });
  }

  /** Keep the CTA layout inside Replayable's safe area. */
  function updateLayout(): void {
    applySafeArea(content);
  }

  function openStore(event: PointerEvent): void {
    if (event.isPrimary && event.button === 0) {
      playable.openStore();
    }
  }

  /** Stop subscriptions and animations before removing the end card. */
  function destroy(): void {
    removeResize();
    entrance?.destroy();
    storeTarget.removeEventListener('pointerup', openStore);
    container.remove();
  }
}

/** Build a hidden overlay with a full-screen backdrop and safe-area content. */
function createEndCardElements() {
  const label = playable.localization.translate(locales.playNow);
  const button = createCtaButton({ text: label, artwork: sprites['ui/endcard-button'] });

  const backdrop = document.createElement('div');
  backdrop.className = 'city-end-card-backdrop';

  const content = document.createElement('div');
  content.className = 'city-end-card-content city-end-card-layout';
  content.append(button);

  const container = createInterfaceContainer();
  container.classList.add('city-end-card');
  container.ariaLabel = label;
  container.hidden = true;
  container.append(backdrop, content);

  return { container, content, backdrop, button };
}
