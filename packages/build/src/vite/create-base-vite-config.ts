import type { InlineConfig } from 'vite';

/** Creates environment-independent Vite configuration for one Replayable project. */
export function createBaseViteConfig(projectRoot: string): InlineConfig {
  return {
    configFile: false,
    envDir: false,
    logLevel: 'warn',
    publicDir: false,
    root: projectRoot,
  };
}
