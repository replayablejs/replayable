import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RuntimeHost } from '#types/network.js';

const runtimeDirectory = dirname(fileURLToPath(import.meta.resolve('@replayablejs/runtime')));

/** Returns the private runtime adapter module selected by Replayable. */
export function resolveRuntimeAdapter(host: RuntimeHost): string {
  return resolve(runtimeDirectory, 'adapters', `${host}.js`);
}
