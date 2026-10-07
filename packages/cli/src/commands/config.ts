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
    .option('--metadata', 'print JSON with parameter definitions and resolved variants')
    .action(async (options: ConfigOptions) => showConfig(options));
}

/** Loads one project config and presents its concrete playable variants. */
async function showConfig({ config: configPath, json, metadata }: ConfigOptions): Promise<void> {
  const config = replayableConfigSchema.parse(await loadDefaultExport(configPath));
  const variants = createVariants(config);

  if (json || metadata) {
    const output = metadata ? { schemaVersion: 1, params: config.params, variants } : variants;
    console.log(JSON.stringify(output, null, 2));

    return;
  }

  await openConfigViewer(config, variants, configPath);
  console.log('Opened the playable variants in your browser.');
}
