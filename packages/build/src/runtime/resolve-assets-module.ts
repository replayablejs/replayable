import { resolve } from 'node:path';

import type { PlayableVariant } from '@replayablejs/config';
import { normalizePath } from 'vite';

/** Resolves the generated assets module selected for one playable variant. */
export function resolveAssetsModule(projectRoot: string, variant: PlayableVariant): string {
  return normalizePath(resolve(projectRoot, variant.assets.emit.assets));
}
