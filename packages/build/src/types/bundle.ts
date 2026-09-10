import type { Rolldown } from 'vite';

/** Named JavaScript entries emitted for one playable variant. */
export interface BundleEntries {
  /** Network integration kept visible to delivery-platform validators. */
  readonly host: string;
  /** Resolved runtime definition kept visible to delivery-platform validators. */
  readonly config: string;
  /** Generated asset registry isolated from application code. */
  readonly assets: string;
  /** Authored application and Replayable runtime entry module. */
  readonly application: string;
}

/** Browser files emitted for one playable variant. */
export interface BundleOutput {
  /** Independently executable host, config, assets, and application entries. */
  readonly entries: BundleEntries;
  /** Output-relative paths to JavaScript modules imported by the application. */
  readonly chunks: readonly string[];
  /** Output-relative paths to stylesheets loaded by the application. */
  readonly stylesheets: readonly string[];
  /** Output-relative paths to emitted images, sounds, fonts, and other resources. */
  readonly resources: readonly string[];
}

export interface EntryBuildOptions {
  /** Whether this first build removes stale files from the variant directory. */
  readonly emptyOutputDirectory: boolean;
  /** Rolldown output shape required by this entry's runtime role. */
  readonly output: Rolldown.OutputOptions;
}

export type EntryOutput = Rolldown.RolldownOutput['output'];
export type EntryRole = keyof BundleEntries;

export interface BundleEntryOutputs {
  readonly host: EntryOutput;
  readonly config: EntryOutput;
  readonly assets: EntryOutput;
  readonly application: EntryOutput;
}
