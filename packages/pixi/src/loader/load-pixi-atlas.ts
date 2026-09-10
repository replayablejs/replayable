import type { AssetLoadContext } from '@replayablejs/runtime';
import type { SpritesheetData, Texture } from 'pixi.js';
import { Assets, Spritesheet } from 'pixi.js';

/** Loads one generated Replayable atlas and registers its parsed Pixi spritesheet. */
export async function loadPixiAtlas(context: AssetLoadContext<'atlases'>): Promise<Spritesheet> {
  const { id, source } = context;
  const [texture, data] = await Promise.all([
    Assets.load<Texture>(source.image),
    loadSpritesheetData(id, source.json),
  ]);
  const spritesheet = new Spritesheet({ data, texture });

  await spritesheet.parse();
  Assets.cache.set(id, spritesheet);

  return spritesheet;
}

/** Resolves either generated inline JSON or an emitted atlas JSON resource. */
async function loadSpritesheetData(
  id: string,
  source: AssetLoadContext<'atlases'>['source']['json'],
): Promise<SpritesheetData> {
  const data: unknown =
    typeof source === 'string' ? await fetchSpritesheetData(id, source) : source;

  if (!isSpritesheetData(data)) {
    throw new Error(`Replayable atlas "${id}" contains invalid spritesheet data.`);
  }

  return data;
}

/** Fetches JSON only when the active asset mode emitted it as a resource URL. */
async function fetchSpritesheetData(id: string, url: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to load Replayable atlas "${id}" from ${url}.`);
  }

  return response.json();
}

/** Checks the required top-level shape before passing generated JSON to Pixi. */
function isSpritesheetData(value: unknown): value is SpritesheetData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'frames' in value && 'meta' in value;
}
