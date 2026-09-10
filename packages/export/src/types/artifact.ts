/** Fully prepared network output that has not yet been written to disk. */
export interface PreparedExportArtifact {
  readonly content: string | Uint8Array;
  /** Absolute destination assigned during export resolution. */
  readonly outputFile: string;
  /** Resolved variant identifier reported after emission. */
  readonly variantId: string;
}
