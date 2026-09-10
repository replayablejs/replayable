import { styleText } from 'node:util';

import { servePreview } from '@replayablejs/build';
import { replayableConfigSchema } from '@replayablejs/config';
import { InvalidArgumentError, type Command } from 'commander';

import { loadDefaultExport } from '../config/load-default-export.js';
import type { DevOptions } from '../types/commands.js';

/** Registers the command that runs one playable variant with Vite HMR. */
export function registerDevCommand(program: Command): void {
  program
    .command('dev')
    .description('Run one playable variant locally')
    .option('-c, --config <file>', 'path to the Replayable config', 'replayable.config.ts')
    .option('--host <host>', 'hostname or IP address to expose')
    .option('--language <language>', 'playable language to run')
    .option('-o, --open', 'open the playable in the default browser')
    .option('-p, --port <port>', 'development server port', parsePort)
    .option('--version <version>', 'playable version to run')
    .action(async (options: DevOptions) => runDevCommand(options));
}

/** Loads the project, starts local development, and reports reachable URLs. */
async function runDevCommand(options: DevOptions): Promise<void> {
  const { config: configPath, ...developmentOptions } = options;
  const config = replayableConfigSchema.parse(await loadDefaultExport(configPath));
  const result = await servePreview(config, {
    ...developmentOptions,
    projectRoot: process.cwd(),
  });

  logDevelopmentValue('Playable', result.variantId);

  for (const url of result.localUrls) {
    logDevelopmentValue('Local', url);
  }

  for (const url of result.networkUrls) {
    logDevelopmentValue('Network', url);
  }

  console.log();
}

/** Prints one aligned and colored development server value. */
function logDevelopmentValue(label: string, value: string): void {
  const coloredLabel = styleText('green', label.padEnd(10));
  const coloredValue = styleText('cyan', value);

  console.log(`${coloredLabel}${coloredValue}`);
}

/** Parses and validates Commander's string-valued port option. */
function parsePort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new InvalidArgumentError('Port must be an integer from 1 through 65535.');
  }

  return port;
}
