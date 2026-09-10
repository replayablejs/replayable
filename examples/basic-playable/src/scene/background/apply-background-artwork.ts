import { playable } from '@replayablejs/runtime';

import { fonts, sprites } from '../../assets/registries';

/** Gives CSS the loaded artwork without importing generated asset modules or raw paths. */
export function applyBackgroundArtwork(root: HTMLElement): void {
  const images = {
    '--game-background': sprites['gameplay/background'],
    '--end-card-background': sprites['endcard/background'],
    '--game-logo': sprites['ui/logo'],
    '--panel-image': sprites['ui/panel'],
    '--persistent-cta-image': sprites['ui/persistent-cta-button'],
    '--end-card-cta-image': sprites['ui/endcard-button'],
  };

  root.style.fontFamily = `${JSON.stringify(fonts['Noto Sans Armenian'])}, sans-serif`;

  for (const [property, id] of Object.entries(images)) {
    const image = playable.loader.cache.sprites?.[id];
    if (!(image instanceof HTMLImageElement)) {
      throw new Error(`Word Garden image "${id}" has not been loaded.`);
    }

    root.style.setProperty(property, `url(${JSON.stringify(image.src)})`);
  }
}
