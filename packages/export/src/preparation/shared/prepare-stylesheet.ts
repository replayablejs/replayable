import { transform } from 'esbuild';

/**
 * Prepares generated CSS for compact and safe embedding inside a style element.
 *
 * Esbuild's "inline-style" support escapes source that could otherwise terminate
 * the containing style element when the final HTML is parsed.
 */
export async function prepareExportStylesheet(source: string): Promise<string> {
  const result = await transform(source, {
    loader: 'css',
    minify: true,
    supported: { 'inline-style': true },
  });

  return result.code;
}
