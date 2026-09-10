import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const buildDirectory = dirname(fileURLToPath(import.meta.resolve('@replayablejs/build')));

/** Resolves one private browser module emitted beside the build package entry. */
export function resolveBuildRuntimeModule(modulePath: string): string {
  return resolve(buildDirectory, 'runtime', modulePath);
}
