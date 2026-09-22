import { playable } from '@replayablejs/runtime';

import type { CtaButtonConfig } from '../../types/cta-button';

/** Create the button's appearance. Its owner handles store input and cleanup. */
export function createCtaButton({ text, artwork }: CtaButtonConfig): HTMLButtonElement {
  const label = document.createElement('span');
  label.textContent = text;

  // loadImage already decoded this sprite; a CSS background only needs its URL.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const backgroundImage = playable.loader.cache.sprites![artwork] as HTMLImageElement;
  // Quote the loaded image URL so it is safe to use inside CSS url(...).
  const backgroundUrl = `url(${JSON.stringify(backgroundImage.src)})`;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'city-cta';
  button.style.setProperty('--button-artwork', backgroundUrl);
  button.append(label);

  return button;
}
