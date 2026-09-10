import type { AssetMode, ShaderAsset } from '#types/assets.js';
import type { AssetLoadHandler, LoadedShaderAsset } from '#types/loader.js';

/** Loads one generated WebGL 2 shader pair as engine-neutral GLSL strings. */
export const loadShader: AssetLoadHandler<'shaders', LoadedShaderAsset> = async ({
  assetMode,
  source,
}) => {
  const [frag, vert] = await Promise.all([
    loadShaderSource(source.frag, assetMode),
    loadShaderSource(source.vert, assetMode),
  ]);

  return { frag, vert } satisfies LoadedShaderAsset;
};

/** Returns inline source directly or fetches one emitted shader resource. */
async function loadShaderSource(
  source: ShaderAsset['frag'],
  assetMode: AssetMode,
): Promise<string> {
  if (assetMode === 'inline') {
    return source;
  }

  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Unable to load shader ${source}: ${response.status} ${response.statusText}.`);
  }

  return response.text();
}
