import type { AssetLoadContext } from '@replayablejs/runtime';

/** Loads DOM artwork through Replayable, before the primary bundle becomes ready. */
export async function loadImage({
  source,
}: AssetLoadContext<'sprites'>): Promise<HTMLImageElement> {
  const image = new Image();
  // Image loading supports resource and inline URLs without fetching data URLs,
  // which some ad-network Content Security Policies prohibit.
  image.src = source.src;
  await image.decode();
  return image;
}
