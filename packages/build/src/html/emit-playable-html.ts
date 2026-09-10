import { writeFile } from 'node:fs/promises';

import { renderPlayableHtml } from '#html/render-playable-html.js';
import type { BundleOutput } from '#types/bundle.js';
import type { BuildContext } from '#types/context.js';

/** Writes the runnable HTML document into its prepared variant output. */
export async function emitPlayableHtml(context: BuildContext, bundle: BundleOutput): Promise<void> {
  const source = renderPlayableHtml(context.variant, {
    entry: `./${bundle.entries.application}`,
    head: context.profile.htmlHead,
    initializers: {
      assets: `./${bundle.entries.assets}`,
      config: `./${bundle.entries.config}`,
      host: `./${bundle.entries.host}`,
    },
    loadingIndicator: context.profile.loadingIndicator,
    stylesheets: bundle.stylesheets.map((stylesheet) => `./${stylesheet}`),
  });

  await writeFile(context.htmlFile, source, 'utf8');
}
