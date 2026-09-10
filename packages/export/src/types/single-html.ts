/** Delivery constraints applied to one prepared standalone HTML document. */
export interface SingleHtmlExportOptions {
  /** Checks readable module code before compression can hide it from validators. */
  readonly validateJavaScript?: (sources: readonly string[]) => void;
  /** Maximum accepted UTF-8 document size. */
  readonly maxFileSizeBytes: number;
  /** Human-readable network name used in export diagnostics. */
  readonly networkName: string;
  /** Host-provided references, such as "mraid.js", that must remain external. */
  readonly preservedResourceReferences?: readonly string[];
}
