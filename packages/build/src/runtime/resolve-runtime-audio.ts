import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeDirectory = dirname(fileURLToPath(import.meta.resolve('@replayablejs/runtime')));

/** Returns the enabled or no-op audio module selected for one concrete variant. */
export function resolveRuntimeAudio(enabled: boolean): string {
  return resolve(runtimeDirectory, 'audio', enabled ? 'enabled.js' : 'disabled.js');
}
