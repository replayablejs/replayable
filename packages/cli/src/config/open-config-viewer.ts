import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import type { PlayableVariant, ReplayableConfig } from '@replayablejs/config';
import open from 'open';

import { renderConfigViewer } from './render-config-viewer.js';

/** Writes a self-contained, collapsible variant viewer and opens it in the browser. */
export async function openConfigViewer(
  config: ReplayableConfig,
  variants: readonly PlayableVariant[],
  configPath: string,
): Promise<void> {
  const viewerDirectory = join(tmpdir(), 'replayable');
  const viewerPath = join(viewerDirectory, createViewerFileName(configPath));

  await mkdir(viewerDirectory, { recursive: true });
  await writeFile(viewerPath, renderConfigViewer(config, variants), 'utf8');
  await open(viewerPath);
}

/** Gives each project config a stable temporary viewer file without exposing its path. */
function createViewerFileName(configPath: string): string {
  const configId = createHash('sha256').update(resolve(configPath)).digest('hex').slice(0, 12);

  return `variants-${configId}.html`;
}
