import type { CheerioAPI } from 'cheerio';

import type { ExportFile } from './export-file.js';

/** One generated file referenced by an element in a playable HTML document. */
export interface HtmlBuildResource {
  readonly element: ReturnType<CheerioAPI>;
  readonly file: ExportFile;
}

/** Named JavaScript entries referenced by one production build document. */
export interface HtmlBuildEntries {
  /** Network integration that must remain visible to static validators. */
  readonly host: HtmlBuildResource;
  /** Resolved variant data that must remain visible to static validators. */
  readonly config: HtmlBuildResource;
  /** Generated asset registry loaded before the authored application. */
  readonly assets: HtmlBuildResource;
  /** Authored playable application loaded last. */
  readonly application: HtmlBuildResource;
}

/** One of the four explicit build boundaries. */
export type BuildEntryRole = keyof HtmlBuildEntries;

/** Generated resources that an exporter may embed or convert for its network. */
export interface HtmlBuildResources {
  readonly entries: HtmlBuildEntries;
  readonly stylesheets: readonly HtmlBuildResource[];
}
