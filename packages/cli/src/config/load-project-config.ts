import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { applyProjectData, projectDataSchema, replayableConfigSchema } from '@replayablejs/config';
import type { ReplayableConfig } from '@replayablejs/config';

import { loadDefaultExport } from './load-default-export.js';

/** Load developer configuration and optional saved data from the same directory. */
export async function loadProjectConfig(configPath: string): Promise<ReplayableConfig> {
  const config = replayableConfigSchema.parse(await loadDefaultExport(configPath));
  const projectPath = join(dirname(resolve(configPath)), 'replayable.project.json');
  let source: string;
  try {
    source = await readFile(projectPath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return config;
    }
    throw new Error(`Could not read project data ${projectPath}`, { cause: error });
  }

  try {
    return applyProjectData(config, projectDataSchema.parse(JSON.parse(source)));
  } catch (error) {
    throw new Error(`Invalid project data ${projectPath}`, { cause: error });
  }
}
