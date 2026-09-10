import type { Plugin } from 'vite';

import type { GeneratedAssetsBoundaryPluginOptions } from '#types/vite.js';
import { resolvePhysicalId } from '#vite/resolve-physical-id.js';

/** Prevents application code from importing the physical generated asset registry. */
export function createGeneratedAssetsBoundaryPlugin(
  options: GeneratedAssetsBoundaryPluginOptions,
): Plugin {
  const allowedImporter =
    options.allowedImporter === undefined ? undefined : resolvePhysicalId(options.allowedImporter);
  const generatedAssetsModule = resolvePhysicalId(options.assetsModule);

  return {
    name: 'replayable:generated-assets-boundary',
    enforce: 'pre',

    async resolveId(source, importer) {
      if (importer === undefined) {
        return undefined;
      }

      const resolved = await this.resolve(source, importer, { skipSelf: true });

      if (resolved === null || resolvePhysicalId(resolved.id) !== generatedAssetsModule) {
        return resolved;
      }

      if (allowedImporter !== undefined && resolvePhysicalId(importer) === allowedImporter) {
        return resolved;
      }

      throw new Error(
        [
          'The generated assets module is internal to the Replayable build.',
          'Consume assets through playable.loader instead of importing the generated module directly.',
        ].join(' '),
      );
    },
  };
}
