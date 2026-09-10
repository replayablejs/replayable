import type { BuildAssetsResult } from '@replayablejs/assets';

/** Optional variant and server choices accepted by local development. */
export interface ServePreviewOptions {
  /** Hostname or IP address exposed by the development server. */
  readonly host?: string;
  /** Language selected from the configured playable variants. */
  readonly language?: string;
  /** Opens the playable in the default browser after the server starts. */
  readonly open?: boolean;
  /** Preferred development server port. */
  readonly port?: number;
  /** Root directory of the authored Replayable project. */
  readonly projectRoot: string;
  /** Version selected from the configured playable variants. */
  readonly version?: string;
}

/** Running local development server and its selected playable variant. */
export interface ServePreviewResult {
  /** Stops the development server and releases its resources. */
  readonly close: () => Promise<void>;
  /** URLs available only from the current machine. */
  readonly localUrls: readonly string[];
  /** URLs exposed to other devices on the network. */
  readonly networkUrls: readonly string[];
  /** ID of the concrete version, network, and language being served. */
  readonly variantId: string;
}

/** Explicit filesystem destinations required to build one concrete variant. */
export interface BuildVariantOptions {
  /** Absolute directory that will contain this runnable playable. */
  readonly outputDirectory: string;
  /** Root directory of the authored Replayable project. */
  readonly projectRoot: string;
}

/** Files and metadata produced by one successful playable build. */
export interface BuildVariantResult {
  /** Summary of the assets consumed by the playable bundle. */
  readonly assets: BuildAssetsResult;
  /** Absolute path to the generated playable HTML document. */
  readonly htmlFile: string;
  /** Absolute directory containing the complete runnable playable. */
  readonly outputDirectory: string;
  /** ID of the concrete version, network, and language that was built. */
  readonly variantId: string;
}

/** Files and metadata produced by one successful project build. */
export interface BuildProjectResult {
  /** Absolute directory containing every generated playable variant. */
  readonly outputDirectory: string;
  /** Results for the concrete variants in deterministic configuration order. */
  readonly variants: readonly BuildVariantResult[];
}

export type VariantSelection = Pick<ServePreviewOptions, 'language' | 'version'>;
