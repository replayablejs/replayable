import type { PlayableVariant } from '@replayablejs/config';
import { toHtml } from 'hast-util-to-html';
import { h } from 'hastscript';

import { renderPlayableShell, resolvePlayableShellStyles } from '#html/playable-shell.js';
import type { PlayableHtmlInitializers, PlayableHtmlResources } from '#types/html.js';

/** Renders the shared playable document used by development and production. */
export function renderPlayableHtml(
  variant: PlayableVariant,
  resources: PlayableHtmlResources,
): string {
  const networkMetaTags = resources.head.metaTags.map(({ name, content }) =>
    h('meta', { name, content }),
  );
  const stylesheets = resources.stylesheets.map((stylesheet) =>
    h('link', { href: stylesheet, rel: 'stylesheet' }),
  );
  const networkScripts = resources.head.scripts.map(({ src }) => h('script', { src }));
  const initializationScripts = renderInitializationScripts(resources.initializers);
  const shellStyles = resolvePlayableShellStyles(resources.loadingIndicator);
  const document = h(null, [
    { type: 'doctype' },
    h(
      'html',
      {
        lang: variant.localization.language,
        style: { 'background-color': variant.backgroundColor },
      },
      [
        h('head', [
          h('meta', { charSet: 'UTF-8' }),
          h('meta', {
            name: 'viewport',
            content:
              'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
          }),
          ...networkMetaTags,
          h('title', variant.projectName),
          h('style', shellStyles),
          ...stylesheets,
          ...networkScripts,
        ]),
        h('body', [
          renderPlayableShell(resources.loadingIndicator),
          ...initializationScripts,
          h('script', {
            'data-replayable-entry': 'application',
            src: resources.entry,
            type: 'module',
          }),
        ]),
      ],
    ),
  ]);

  return `${toHtml(document)}\n`;
}

/** Renders scope initialization in its required execution order. */
function renderInitializationScripts(
  initializers: PlayableHtmlInitializers | undefined,
): ReturnType<typeof h>[] {
  if (initializers === undefined) {
    return [];
  }

  return [
    h('script', {
      'data-replayable-entry': 'host',
      src: initializers.host,
      type: 'module',
    }),
    h('script', {
      'data-replayable-entry': 'config',
      src: initializers.config,
      type: 'module',
    }),
    h('script', {
      'data-replayable-entry': 'assets',
      src: initializers.assets,
      type: 'module',
    }),
  ];
}
