import { relative } from 'node:path';
import { styleText } from 'node:util';

import { normalizePath, type Plugin } from 'vite';

const UPDATE_LABELS = {
  create: 'Created',
  delete: 'Deleted',
  update: 'Updated',
} as const;
const DUPLICATE_UPDATE_WINDOW = 100;

/** Reports Vite file updates without exposing Vite as the public development interface. */
export function createDevelopmentReporterPlugin(projectRoot: string): Plugin {
  const recentUpdates = new Map<string, number>();

  return {
    name: 'replayable:development-reporter',
    hotUpdate(options) {
      if (this.environment.name !== 'client') {
        return;
      }

      const file = normalizePath(relative(projectRoot, options.file));
      const startedAt = performance.now();
      const previousUpdate = recentUpdates.get(file);

      // Editors may save one file through several rapid filesystem writes.
      if (previousUpdate !== undefined && startedAt - previousUpdate < DUPLICATE_UPDATE_WINDOW) {
        return;
      }

      recentUpdates.set(file, startedAt);

      setImmediate(() => {
        const duration = Math.round(performance.now() - startedAt);
        const label = styleText('green', UPDATE_LABELS[options.type].padEnd(9));
        const formattedDuration = duration === 0 ? '<1ms' : `${duration}ms`;
        const details = styleText('dim', `${file} in ${formattedDuration}`);

        console.log(`${label} ${details}`);
      });
    },
  };
}
