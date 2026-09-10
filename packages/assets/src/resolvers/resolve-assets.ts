import { discoverSourceFiles } from '#pipeline/discover-source-files.js';
import type { AssetConfig } from '#types/config.js';
import type { BuildContext } from '#types/context.js';
import type { ResolvedAsset } from '#types/resolved-assets.js';

import { resolveAtlases } from './categories/atlas.js';
import { resolveFonts } from './categories/font.js';
import { resolveLocales } from './categories/locale.js';
import { resolveShaders } from './categories/shader.js';
import { resolveSounds } from './categories/sound.js';
import { resolveSpines } from './categories/spine.js';
import { resolveSprites } from './categories/sprite.js';
import { resolveTextures } from './categories/texture.js';
import { collectLocaleCharacters } from './font-charset.js';
import { createResolutionContext } from './resolution-context.js';

/**
 * Discovers source files and converts them into self-contained build instructions.
 *
 * Locales resolve first because their selected text determines the characters
 * retained by every generated font. All other categories are independent.
 */
export async function resolveAssets(
  config: AssetConfig,
  context: BuildContext,
): Promise<ResolvedAsset[]> {
  // Scan the source tree once so every category resolves against the same
  // deterministic file inventory.
  const files = await discoverSourceFiles(context.sourceRoot);
  const resolution = createResolutionContext(config, context, files);

  // Resolve the fixed-language dictionaries before fonts. Their selected text
  // contributes every non-ASCII character that generated font subsets need.
  const locales = await resolveLocales(resolution);
  const localeCharacters = collectLocaleCharacters(locales.map((locale) => locale.resolvedLocale));

  // Each category resolver now returns complete instructions for its processor.
  // Spine is asynchronous because it reads atlas page declarations from disk.
  const atlases = resolveAtlases(resolution);
  const fonts = resolveFonts(resolution, localeCharacters);
  const shaders = resolveShaders(resolution);
  const sounds = resolveSounds(resolution);
  const spines = await resolveSpines(resolution);
  const sprites = resolveSprites(resolution);
  const textures = resolveTextures(resolution);

  // Keep category boundaries visible here while returning the one flat list
  // consumed by the processing stage.
  return [
    ...atlases,
    ...fonts,
    ...locales,
    ...shaders,
    ...sounds,
    ...spines,
    ...sprites,
    ...textures,
  ];
}
