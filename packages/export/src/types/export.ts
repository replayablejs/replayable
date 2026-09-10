/** Explicit project and destination choices for one export operation. */
export interface ExportProjectOptions {
  /** Optional output directory, resolved from the project root and defaulting to `exports`. */
  readonly outputDirectory?: string;
  /** Root directory of the authored Replayable project. */
  readonly projectRoot: string;
}

/** One upload-ready artifact produced from an existing playable variant build. */
export interface ExportVariantResult {
  /** Absolute path to the exported delivery artifact. */
  readonly file: string;
  /** Final artifact size in bytes. */
  readonly size: number;
  /** ID of the concrete version, network, and language that was exported. */
  readonly variantId: string;
}

/** Delivery artifacts produced by one successful project export. */
export interface ExportProjectResult {
  /** Absolute directory containing every configured network's artifacts. */
  readonly outputDirectory: string;
  /** Exported variants in deterministic configuration order. */
  readonly variants: readonly ExportVariantResult[];
}
