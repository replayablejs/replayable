import { load, type CheerioAPI } from 'cheerio';

import { resolveExportFileReference } from '#shared/export-file-reference.js';
import { requirePlayableHtml } from '#shared/playable-html.js';
import type { ExportFile } from '#types/export-file.js';
import type {
  BuildEntryRole,
  HtmlBuildResource,
  HtmlBuildResources,
} from '#types/html-document.js';
import { validateBuildEntryOrder } from '#validation/build-entries.js';

import { prepareClassicJavaScript } from './prepare-classic-javascript.js';
import { prepareExportJavaScript } from './prepare-javascript.js';
import { prepareExportStylesheet } from './prepare-stylesheet.js';

const ENTRY_ATTRIBUTE = 'data-replayable-entry';

/** Loads the required root HTML document from collected build files. */
export function loadHtmlBuildDocument(files: readonly ExportFile[], variantId: string): CheerioAPI {
  const html = requirePlayableHtml(files, variantId);

  return load(new TextDecoder().decode(html.data));
}

/**
 * Resolves the local host, config, assets, application, and stylesheet files
 * referenced by a production build document.
 *
 * Host-provided and external resources are ignored. Every marked entry and local
 * stylesheet must exist in `files`. Internal entry markers are removed after
 * resolution so they never appear in network delivery HTML.
 */
export function resolveHtmlBuildResources(
  document: CheerioAPI,
  files: readonly ExportFile[],
  variantId: string,
): HtmlBuildResources {
  validateBuildEntryOrder(document, variantId);

  return {
    entries: {
      host: resolveEntry(document, files, variantId, 'host'),
      config: resolveEntry(document, files, variantId, 'config'),
      assets: resolveEntry(document, files, variantId, 'assets'),
      application: resolveEntry(document, files, variantId, 'application'),
    },
    stylesheets: resolveStylesheets(document, files, variantId),
  };
}

/** Replaces every generated stylesheet link with minified inline CSS. */
export async function inlineStylesheets(
  document: CheerioAPI,
  stylesheets: readonly HtmlBuildResource[],
): Promise<void> {
  for (const stylesheet of stylesheets) {
    const source = new TextDecoder().decode(stylesheet.file.data);
    const inlineSource = await prepareExportStylesheet(source);
    const style = document('<style></style>').text(inlineSource);

    stylesheet.element.replaceWith(style);
  }
}

/** Reads and normalizes a generated module before its delivery form is selected. */
export function prepareModuleEntrySource(entry: HtmlBuildResource): Promise<string> {
  const source = new TextDecoder().decode(entry.file.data);

  return prepareExportJavaScript(source, 'module');
}

/** Replaces a module reference with an already prepared inline source. */
export function inlinePreparedModuleEntry(entry: HtmlBuildResource, source: string): void {
  entry.element.removeAttr('src');
  entry.element.text(source);
}

/**
 * Converts one external module entry into an external classic script.
 *
 * The HTML element keeps its `src` but loses `type="module"`. The returned file
 * contains an async IIFE so authored top-level `await` retains its behavior.
 */
export async function prepareClassicScriptEntry(entry: HtmlBuildResource): Promise<ExportFile> {
  const source = new TextDecoder().decode(entry.file.data);
  const javaScript = await prepareClassicJavaScript(source);

  entry.element.removeAttr('type');

  return {
    path: entry.file.path,
    data: new TextEncoder().encode(javaScript),
  };
}

/** Serializes a transformed document with one deterministic trailing newline. */
export function serializeHtmlDocument(document: CheerioAPI): string {
  return `${document.html()}\n`;
}

/** Resolves exactly one local script carrying the requested Replayable entry role. */
function resolveEntry(
  document: CheerioAPI,
  files: readonly ExportFile[],
  variantId: string,
  role: BuildEntryRole,
): HtmlBuildResource {
  const entries: HtmlBuildResource[] = [];

  for (const element of document(`script[${ENTRY_ATTRIBUTE}="${role}"][src]`).toArray()) {
    const script = document(element);
    const reference = script.attr('src');

    if (reference === undefined) {
      continue;
    }

    const resource = resolveLocalResource(script, reference, files, variantId);

    if (resource !== undefined) {
      script.removeAttr(ENTRY_ATTRIBUTE);
      entries.push(resource);
    }
  }

  const entry = entries[0];

  if (entry === undefined || entries.length !== 1) {
    throw new Error(
      `Build ${variantId} requires exactly one local ${role} entry; received ${entries.length}.`,
    );
  }

  return entry;
}

/** Resolves local stylesheet links while preserving their document positions. */
function resolveStylesheets(
  document: CheerioAPI,
  files: readonly ExportFile[],
  variantId: string,
): HtmlBuildResource[] {
  const stylesheets: HtmlBuildResource[] = [];

  for (const element of document('link[rel][href]').toArray()) {
    const stylesheet = document(element);
    const relation = stylesheet.attr('rel');
    const reference = stylesheet.attr('href');
    const isStylesheet =
      relation?.split(/\s+/u).some((value) => value.toLowerCase() === 'stylesheet') ?? false;

    if (!isStylesheet || reference === undefined) {
      continue;
    }

    const resource = resolveLocalResource(stylesheet, reference, files, variantId);

    if (resource !== undefined) {
      stylesheets.push(resource);
    }
  }

  return stylesheets;
}

/** Resolves one local document reference while leaving host and remote URLs untouched. */
function resolveLocalResource(
  element: ReturnType<CheerioAPI>,
  reference: string,
  files: readonly ExportFile[],
  variantId: string,
): HtmlBuildResource | undefined {
  const path = resolveExportFileReference(reference);

  if (path === undefined) {
    return undefined;
  }

  const file = files.find((candidate) => candidate.path === path);

  if (file === undefined) {
    throw new Error(`Build ${variantId} contains an unavailable local resource: ${reference}.`);
  }

  return { element, file };
}
