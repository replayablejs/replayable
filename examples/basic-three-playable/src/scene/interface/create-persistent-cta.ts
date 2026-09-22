import { playable } from '@replayablejs/runtime';

import { locales } from '../../assets/registries/locales';
import { sprites } from '../../assets/registries/sprites';
import { createCtaButton } from './create-cta-button';

/** Owns the gameplay store button, including network visibility and input cleanup. */
export function createPersistentCta() {
  if (!playable.config.controls.persistentCta) {
    return undefined;
  }

  const label = playable.localization.translate(locales.downloadNow);
  const button = createCtaButton({ text: label, artwork: sprites['ui/cta-button'] });

  // Use pointerup because the runtime's touch guards can suppress mobile clicks.
  button.addEventListener('pointerup', openFromPointer);

  return { button, destroy };

  function openFromPointer(event: PointerEvent): void {
    if (event.isPrimary && event.button === 0) {
      playable.openStore();
    }
  }

  function destroy(): void {
    button.removeEventListener('pointerup', openFromPointer);
    button.remove();
  }
}
