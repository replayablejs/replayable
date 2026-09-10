import type { ResolvedAsset } from '#types/resolved-assets.js';

/**
 * Reserves physical output identities before concurrent processors start.
 * Bundles are runtime groups, not separate filesystem trees. For example,
 * primary `textures/logo.png` and secondary `textures/logo.webp` would both
 * write candidates at `textures/logo.*`, so they must not share that basename.
 * Runtime-ID validation still runs after processing for expanded atlas sheets.
 */
export function validateOutputClaims(assets: readonly ResolvedAsset[]): void {
  const owners = new Map<string, string>();

  for (const asset of assets) {
    const path = 'outputBasePath' in asset ? asset.outputBasePath : asset.outputDirectory;
    const owner = owners.get(path);
    if (owner !== undefined) {
      throw new Error(
        `Asset output collision: ${owner} and ${asset.relativePath} both write ${path}.`,
      );
    }
    owners.set(path, asset.relativePath);
  }
}
