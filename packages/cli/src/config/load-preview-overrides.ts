import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { previewOverridesSchema, type ReplayablePreviewOverrides } from '@replayablejs/config';

/** Read data only; override files never execute as configuration modules. */
export async function loadPreviewOverrides(path: string): Promise<ReplayablePreviewOverrides> {
  try {
    const source = await readFile(resolve(path), 'utf8');
    return previewOverridesSchema.parse(JSON.parse(source));
  } catch (cause) {
    throw new Error(`Could not load preview overrides from "${path}".`, { cause });
  }
}
