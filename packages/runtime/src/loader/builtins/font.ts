import type { AssetLoadHandler } from '#types/loader.js';

/** Loads one generated WOFF2 file and registers it with the browser. */
export const loadFont: AssetLoadHandler<'fonts', FontFace> = async ({ source }) => {
  const font = new FontFace(source.family, `url(${JSON.stringify(source.src)}) format("woff2")`);
  const loadedFont = await font.load();

  document.fonts.add(loadedFont);

  return loadedFont;
};
