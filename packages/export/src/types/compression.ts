/** Prepared module source and its optional Pako-compressed Base64 representation. */
export interface JavaScriptCompressionCandidate {
  /** Base64 DEFLATE payload when the source passes the compression threshold. */
  readonly compressedPayload: string | undefined;
  /** Export-normalized JavaScript retained for ordinary inline delivery. */
  readonly source: string;
}
import type { HtmlBuildResource } from './html-document.js';

/** Prepared source and its destination element. */
export interface CompressibleEntry {
  readonly candidate: JavaScriptCompressionCandidate;
  readonly resource: HtmlBuildResource;
}

/** Entries eligible for compression, in execution order. */
export interface CompressibleEntries {
  readonly assets: CompressibleEntry;
  readonly application: CompressibleEntry;
}
