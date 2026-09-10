import { assetConfigSchema, buildAssets } from '@replayablejs/assets';
import type { Command } from 'commander';

import { loadDefaultExport } from '../config/load-default-export.js';
import type { AssetsOptions } from '../types/commands.js';

export function registerAssetsCommand(program: Command): void {
  program
    .command('assets')
    .description('Build optimized, typed assets')
    .option('-c, --config <file>', 'path to the asset configuration', 'replayable.assets.ts')
    .action(async ({ config }: AssetsOptions) => build(config));
}

async function build(configPath: string): Promise<void> {
  const config = assetConfigSchema.parse(await loadDefaultExport(configPath));
  const result = await buildAssets(config);

  console.log(
    `Built ${result.emittedAssets} asset${result.emittedAssets === 1 ? '' : 's'} (${result.emittedFiles} file${result.emittedFiles === 1 ? '' : 's'}) into ${result.outputDirectory}`,
  );
}
