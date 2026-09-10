import { Command } from 'commander';

import { registerAssetsCommand } from './commands/assets.js';
import { registerBuildCommand } from './commands/build.js';
import { registerConfigCommand } from './commands/config.js';
import { registerDevCommand } from './commands/dev.js';
import { registerExportCommand } from './commands/export.js';

export function createProgram(): Command {
  const program = new Command()
    .name('replayable')
    .description('Build playable ads with Replayable')
    .showHelpAfterError();

  registerBuildCommand(program);
  registerDevCommand(program);
  registerExportCommand(program);
  registerConfigCommand(program);
  registerAssetsCommand(program);

  return program;
}
