import { playable } from '@replayablejs/runtime';
import { animate } from '@replayablejs/tween';
import type { TweenPlaybackControls } from '@replayablejs/tween';

import { endCardAnimation } from './configs/end-card-animation';
import { createLogo } from './create-logo';
import { createPersistentCta } from './create-persistent-cta';
import { applySafeArea, createInterfaceContainer } from './interface-layout';

import './interface.css';

/** Owns the gameplay logo and optional persistent store button. */
export function createInterface() {
  const logo = createLogo();
  const persistentCta = createPersistentCta();
  let logoTransition: TweenPlaybackControls | undefined;

  const container = createInterfaceContainer();
  container.classList.add('city-interface-content');
  container.dataset.state = 'gameplay';
  container.append(logo);
  if (persistentCta) {
    container.append(persistentCta.button);
  }

  playable.container.append(container);

  // Mount first so layout and the later logo transition can measure real bounds.
  updateLayout();
  const removeResize = playable.on('resize', updateLayout);

  return { moveLogoToEndCardPosition, hidePersistentCta, destroy };

  /** Use Replayable's safe area; CSS handles the inner layout. */
  function updateLayout(): void {
    container.dataset.orientation = playable.screen.orientation;
    applySafeArea(container);
    logoTransition?.complete();
  }

  /** Switch the logo's CSS pose, then animate from its previous screen position. */
  function moveLogoToEndCardPosition(): void {
    const start = logo.getBoundingClientRect();
    container.dataset.state = 'endcard';
    container.classList.add('city-end-card-layout');
    const destination = logo.getBoundingClientRect();

    const offsetX = start.left - destination.left;
    const offsetY = start.top - destination.top;
    const scale = start.width / destination.width;
    const startTransform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

    // Preserve the gameplay pose immediately; the tween starts on a later frame.
    logo.style.transform = startTransform;
    logoTransition = animate(
      logo,
      { transform: [startTransform, 'translate(0px, 0px) scale(1)'] },
      { duration: endCardAnimation.logoDuration, ease: 'easeInOut' },
    );
  }

  /** Hide only the persistent store button; cleanup remains owned by destroy. */
  function hidePersistentCta(): void {
    if (persistentCta) {
      persistentCta.button.hidden = true;
    }
  }

  /** Stop layout updates and release the gameplay controls. */
  function destroy(): void {
    removeResize();
    logoTransition?.cancel();
    persistentCta?.destroy();
    container.remove();
  }
}
