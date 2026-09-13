import { randomUUID } from 'node:crypto';

import { parse } from 'acorn';
import { transform } from 'esbuild';

import { prepareExportJavaScript } from './prepare-javascript.js';

/**
 * Converts a self-contained module into Mintegral's external classic script.
 * Vite's dynamic-import helpers can retain import.meta even without splitting.
 * Resolve their URL against the executing script, not the containing HTML page.
 */
export async function prepareClassicJavaScript(source: string): Promise<string> {
  // UUID v4 has 122 random bits. Matching any one existing identifier has probability
  // 1 / 2^122 (about 1 in 5.3e36); for N distinct matching-format names, N / 2^122.
  // Even 1e9 UUIDs have a pair-collision probability of about 9.4e-20
  // (birthday approximation: n * (n - 1) / (2 * 2^122)). Here only collisions
  // with authored identifiers in this script matter, not UUIDs from other builds.
  // This is probabilistic, not a guarantee; the prefix and removed hyphens make
  // the name a valid JS identifier. Randomness also makes build output vary.
  const entryUrlIdentifier = `entryUrl_${randomUUID().replaceAll('-', '')}`;
  const transformed = await transform(source, {
    loader: 'js',
    define: {
      'import.meta.url': entryUrlIdentifier,
      // Vite already falls back to new URL(specifier, import.meta.url).
      'import.meta.resolve': 'undefined',
    },
  });

  // Capture currentScript synchronously: it becomes null after an await.
  // The async wrapper preserves authored top-level await and isolates entries.
  const wrapped = `(async function (${entryUrlIdentifier}) {
'use strict';
${transformed.code}
})(document.currentScript.src);`;
  const result = await prepareExportJavaScript(wrapped, 'script');

  // Wrapping alone cannot convert every module feature. Reject remaining
  // module-only syntax here rather than delivering a script that cannot start.
  parse(result, { ecmaVersion: 'latest', sourceType: 'script' });

  return result;
}
