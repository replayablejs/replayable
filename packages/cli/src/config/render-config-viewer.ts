import { createScript, createStyleSheet, dump, themes } from '@poppinss/dumper/html';
import type { PlayableVariant, ReplayableConfig } from '@replayablejs/config';
import { toHtml } from 'hast-util-to-html';
import { h } from 'hastscript';

import styles from './config-viewer.css?inline';

/** Renders the viewer; authored values remain text, while Dumper owns its HTML. */
export function renderConfigViewer(
  config: ReplayableConfig,
  variants: readonly PlayableVariant[],
): string {
  const head = h('head', [
    h('meta', { charSet: 'UTF-8' }),
    h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
    h('title', 'Replayable Variants'),
    h('style', createStyleSheet() + styles),
    h('script', createScript()),
  ]);
  const summary = h('dl', [
    h('dt', 'Project'),
    h('dd', config.name),
    h('dt', 'Entry'),
    h('dd', config.entry),
    h('dt', 'Variants'),
    h('dd', String(variants.length)),
  ]);
  const content = dump(variants, { expand: true, styles: themes.nightOwl });

  // Both serializers own escaping. The shell embeds their completed markup unchanged.
  return `<!doctype html>
<html lang="en">
  ${toHtml(head)}
  <body><main>
    <h1>Replayable Variants</h1>
    ${toHtml(summary)}
    ${content}
  </main></body>
</html>\n`;
}
