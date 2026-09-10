import { parse } from 'acorn';
import { transform } from 'esbuild';

import { prepareExportJavaScript } from './prepare-javascript.js';

/**
 * Converts a self-contained module into Mintegral's external classic script.
 * Vite's dynamic-import helpers can retain import.meta even without splitting.
 * Resolve their URL against the executing script, not the containing HTML page.
 */
export async function prepareClassicJavaScript(source: string): Promise<string> {
  const transformed = await transform(source, {
    loader: 'js',
    define: {
      'import.meta.url': 'entryUrl',
      // Vite already falls back to new URL(specifier, import.meta.url).
      'import.meta.resolve': 'undefined',
    },
  });

  // Capture currentScript synchronously: it becomes null after an await.
  // The async wrapper preserves authored top-level await and isolates entries.
  const wrapped = `(async function (entryUrl) {
'use strict';
${transformed.code}
})(document.currentScript.src);`;
  const result = await prepareExportJavaScript(wrapped, 'script');

  // Wrapping alone cannot convert every module feature. Reject remaining
  // module-only syntax here rather than delivering a script that cannot start.
  parse(result, { ecmaVersion: 'latest', sourceType: 'script' });

  return result;
}
