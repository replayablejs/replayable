import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PlayableVariant } from '@replayablejs/config';

const devtoolsDirectory = dirname(fileURLToPath(import.meta.resolve('@replayablejs/devtools')));

/** Audio-disabled variants and production never load the sound control or its icons. */
export function resolveSoundControl(command: 'build' | 'serve', enabled: boolean): string {
  return resolve(
    devtoolsDirectory,
    'sound-control',
    command === 'serve' && enabled ? 'enabled.js' : 'disabled.js',
  );
}

/** Production selects a dependency-free stub, regardless of the project's preference. */
export function resolveEndCardTrigger(command: 'build' | 'serve', enabled: boolean): string {
  return resolve(
    devtoolsDirectory,
    'endcard-trigger',
    command === 'serve' && enabled ? 'enabled.js' : 'disabled.js',
  );
}

/** Selects stats before module loading; production never visits the enabled graph. */
export function resolveDevtoolsStats(
  command: 'build' | 'serve',
  stats: PlayableVariant['devtools']['stats'],
): string {
  const enabled =
    command === 'serve' && stats !== false && Object.values(stats).some((value) => value === true);

  return resolve(devtoolsDirectory, 'stats', enabled ? 'enabled.js' : 'disabled.js');
}

/** Context registration is unnecessary unless a WebGL metric is requested in development. */
export function resolveWebglStats(
  command: 'build' | 'serve',
  stats: PlayableVariant['devtools']['stats'],
): string {
  const enabled =
    command === 'serve' &&
    stats !== false &&
    (stats.drawCalls || stats.textureBinds || stats.programUses);

  return resolve(devtoolsDirectory, 'stats', 'webgl', enabled ? 'enabled.js' : 'disabled.js');
}
