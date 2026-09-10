import { minify } from 'terser';

import type { JavaScriptSourceType } from '#types/javascript.js';

/**
 * Prepares generated JavaScript for network delivery and safe HTML embedding.
 *
 * The narrow evaluation pass converts constant template literals produced by
 * the build minifier into ordinary quoted strings without enabling Terser's
 * broader compression transforms. This keeps static network analyzers reliable,
 * while `ascii_only` escapes Unicode for conservative delivery environments and
 * `inline_script` prevents source from closing its containing script element.
 */
export async function prepareExportJavaScript(
  source: string,
  sourceType: JavaScriptSourceType,
): Promise<string> {
  const result = await minify(source, {
    compress: { defaults: false, evaluate: true },
    mangle: false,
    module: sourceType === 'module',
    format: {
      ascii_only: true,
      inline_script: true,
      quote_style: 1,
    },
  });

  if (result.code === undefined) {
    throw new Error('Terser did not produce JavaScript for export.');
  }

  return result.code;
}
