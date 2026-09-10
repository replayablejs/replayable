import { relative } from 'node:path';

import { replayableConfigSchema } from '@replayablejs/config';
import { exportProject } from '@replayablejs/export';
import type { Command } from 'commander';

import { loadDefaultExport } from '../config/load-default-export.js';
import type { ExportOptions } from '../types/commands.js';

/** Registers the command that creates upload-ready network artifacts. */
export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export every configured playable build')
    .option('-c, --config <file>', 'path to the Replayable config', 'replayable.config.ts')
    .option('-o, --output <directory>', 'directory for exported artifacts')
    .action(async (options: ExportOptions) => runExportCommand(options));
}

/** Loads one project config, exports every variant, and reports their files. */
async function runExportCommand(options: ExportOptions): Promise<void> {
  const config = replayableConfigSchema.parse(await loadDefaultExport(options.config));
  const result = await exportProject(config, {
    ...(options.output === undefined ? {} : { outputDirectory: options.output }),
    projectRoot: process.cwd(),
  });

  for (const variant of result.variants) {
    console.log(`Exported ${variant.variantId} → ${relative(process.cwd(), variant.file)}`);
  }

  const count = result.variants.length;

  console.log(`Exported ${count} playable variant${count === 1 ? '' : 's'}.`);
}
