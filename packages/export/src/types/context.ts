import type { PlayableVariant } from '@replayablejs/config';

/** Existing build input and delivery destination for one variant. */
export interface ExportVariantContext {
  /** Absolute directory containing the runnable variant build. */
  readonly buildDirectory: string;
  /** Absolute path of the upload-ready exported artifact. */
  readonly outputFile: string;
  /** Fully resolved configuration for the selected playable variant. */
  readonly variant: PlayableVariant;
}

/** Resolved inputs and destinations shared by one project export operation. */
export interface ExportProjectContext {
  /** Root directory containing every configured network's exported variants. */
  readonly outputDirectory: string;
  /** Configured variants in deterministic configuration order. */
  readonly variants: readonly ExportVariantContext[];
}
