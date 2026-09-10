import { createServer, normalizePath, type ViteDevServer } from 'vite';

import type { DevelopmentContext } from '#types/context.js';
import { createDevelopmentViteConfig } from '#vite/create-development-vite-config.js';
import { createPlayableEntries } from '#vite/create-playable-entries.js';

import { createDevelopmentReporterPlugin } from './plugins/development-reporter.js';
import { createPlayableHtmlPlugin } from './plugins/playable-html.js';

/** Starts Vite for one resolved playable variant and its authored browser entry. */
export async function createDevelopmentServer(context: DevelopmentContext): Promise<ViteDevServer> {
  const entries = createPlayableEntries(context, 'serve');
  const viteConfig = createDevelopmentViteConfig({
    entries,
    projectRoot: context.projectRoot,
    plugins: [
      createPlayableHtmlPlugin(context.variant, {
        entry: toDevelopmentModuleUrl(entries.application.input),
        initializers: {
          assets: toDevelopmentModuleUrl(entries.assets.input),
          config: toDevelopmentModuleUrl(entries.config.input),
          host: toDevelopmentModuleUrl(entries.host.input),
        },
        head: context.profile.htmlHead,
        loadingIndicator: context.profile.loadingIndicator,
        stylesheets: [],
      }),
      createDevelopmentReporterPlugin(context.projectRoot),
    ],
  });
  const server = await createServer({
    ...viteConfig,
    appType: 'custom',
    server: {
      host: context.host,
      open: context.open,
      port: context.port,
    },
  });

  await server.listen();

  return server;
}

/** Converts an absolute private entry path into Vite's browser-facing filesystem URL. */
function toDevelopmentModuleUrl(file: string): string {
  return `/@fs/${normalizePath(file)}`;
}
