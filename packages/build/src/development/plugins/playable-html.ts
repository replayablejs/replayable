import type { PlayableVariant } from '@replayablejs/config';
import type { Plugin } from 'vite';

import { PLAYABLE_HTML_FILE } from '#html/playable-html.js';
import { renderPlayableHtml } from '#html/render-playable-html.js';
import type { PlayableHtmlResources } from '#types/html.js';

/** Serves framework-owned HTML while leaving modules and HMR to Vite. */
export function createPlayableHtmlPlugin(
  variant: PlayableVariant,
  resources: PlayableHtmlResources,
): Plugin {
  return {
    name: 'replayable:html',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!isHtmlRequest(request.url)) {
          next();

          return;
        }

        try {
          const source = renderPlayableHtml(variant, resources);
          const html = await server.transformIndexHtml(request.url ?? '/', source);

          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(html);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

/** Matches only the development document, never module or asset requests. */
function isHtmlRequest(requestUrl: string | undefined): boolean {
  if (requestUrl === undefined) {
    return false;
  }

  const pathname = new URL(requestUrl, 'http://replayable.local').pathname;

  return pathname === '/' || pathname === `/${PLAYABLE_HTML_FILE}`;
}
