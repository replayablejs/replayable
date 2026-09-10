import { relative } from 'node:path';

import { buildProject } from '@replayablejs/build';
import { replayableConfigSchema } from '@replayablejs/config';
import type { Command } from 'commander';

import { loadDefaultExport } from '../config/load-default-export.js';
import type { BuildOptions } from '../types/commands.js';

/** Registers the command that builds every configured playable variant. */
export function registerBuildCommand(program: Command): void {
  program
    .command('build')
    .description('Build every configured playable variant')
    .option('-c, --config <file>', 'path to the Replayable config', 'replayable.config.ts')
    .action(async ({ config }: BuildOptions) => runBuildCommand(config));
}

/** Loads one project config, builds it, and reports the generated playables. */
async function runBuildCommand(configPath: string): Promise<void> {
  const config = replayableConfigSchema.parse(await loadDefaultExport(configPath));
  const result = await buildProject(config);

  for (const variant of result.variants) {
    const htmlFile = relative(process.cwd(), variant.htmlFile);

    console.log(`Built ${variant.variantId} → ${htmlFile}`);
  }

  const count = result.variants.length;

  console.log(`Built ${count} playable variant${count === 1 ? '' : 's'}.`);
}
