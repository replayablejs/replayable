import { createVariants, replayableConfigSchema } from '@replayablejs/config';
import type { Command } from 'commander';

import { loadDefaultExport } from '../config/load-default-export.js';
import { openConfigViewer } from '../config/open-config-viewer.js';
import type { ConfigOptions } from '../types/commands.js';

/** Registers the command that presents every configured playable variant. */
export function registerConfigCommand(program: Command): void {
  program
    .command('config')
    .description('Show the configured playable variants')
    .option('-c, --config <file>', 'path to the Replayable config', 'replayable.config.ts')
    .option('--json', 'print machine-readable JSON')
    .action(async ({ config, json }: ConfigOptions) => showConfig(config, json ?? false));
}

/** Loads one project config and presents its concrete playable variants. */
async function showConfig(configPath: string, json: boolean): Promise<void> {
  const config = replayableConfigSchema.parse(await loadDefaultExport(configPath));
  const variants = createVariants(config);

  if (json) {
    console.log(JSON.stringify(variants, null, 2));

    return;
  }

  await openConfigViewer(config, variants, configPath);
  console.log('Opened the playable variants in your browser.');
}
