import { resolve } from 'node:path';

import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url, { interopDefault: false });

/** Loads the default export from one project configuration module. */
export async function loadDefaultExport(path: string): Promise<unknown> {
  const file = resolve(path);
  const module: unknown = await jiti.import(file);

  if (typeof module !== 'object' || module === null || !('default' in module)) {
    throw new Error(`Configuration ${path} must have a default export.`);
  }

  return module.default;
}
