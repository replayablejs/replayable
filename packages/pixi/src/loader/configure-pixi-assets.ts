import { Assets } from 'pixi.js';

/** Applies deterministic browser-loading behavior for playable assets. */
export function configurePixiAssets(): void {
  Assets.setPreferences({
    // Playable exports must not depend on separately hosted worker scripts.
    preferWorkers: false,
    // Image elements behave more consistently across supported ad webviews.
    preferCreateImageBitmap: false,
  });
}
