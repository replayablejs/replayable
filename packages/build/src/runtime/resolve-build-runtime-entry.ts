import type { BuildRuntimeEntry } from '#types/runtime.js';

import { resolveBuildRuntimeModule } from './resolve-build-runtime-module.js';

/** Resolves one private browser entry emitted with the build package. */
export function resolveBuildRuntimeEntry(entry: BuildRuntimeEntry): string {
  return resolveBuildRuntimeModule(`entries/${entry}.mjs`);
}
