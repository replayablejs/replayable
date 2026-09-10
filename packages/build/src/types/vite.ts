import type { PlayableVariant } from '@replayablejs/config';
import type { AssetMode } from '@replayablejs/runtime/assets';
import type { InlineConfig, PluginOption } from 'vite';

import type { PlayableProfile } from '#types/network.js';

/** One private module entry and the Vite behavior required to consume it. */
export interface PlayableViteEntry {
  /** Absolute source path compiled or served for this entry. */
  readonly input: string;
  /** Aliases, definitions, and plugins owned by this entry role. */
  readonly viteConfig: InlineConfig;
}

/** Host, config, assets, and authored application entries in runtime execution order. */
export interface PlayableViteEntries {
  readonly host: PlayableViteEntry;
  readonly config: PlayableViteEntry;
  readonly assets: PlayableViteEntry;
  readonly application: PlayableViteEntry;
}

/** Resolved inputs shared by Replayable's development and production Vite operations. */
export interface PlayableViteContext {
  /** Absolute path to the playable's authored TypeScript entry module. */
  readonly entryFile: string;
  /** Absolute path of the generated module exposed through `#assets`. */
  readonly assetsModule: string;
  /** Resolved asset, HTML, and runtime policy for the selected environment. */
  readonly profile: PlayableProfile;
  /** Absolute root directory of the authored Replayable project. */
  readonly projectRoot: string;
  /** Concrete version, network, and language combination being run. */
  readonly variant: PlayableVariant;
}

export interface DevelopmentViteConfigOptions {
  /** The shared host, config, assets, and application entry definitions. */
  readonly entries: PlayableViteEntries;
  /** Absolute root used by the single development Vite server. */
  readonly projectRoot: string;
  /** Additional plugins owned only by the development server. */
  readonly plugins?: readonly PluginOption[];
}

export interface PlayableViteContextOptions {
  /** Absolute root directory of the authored Replayable project. */
  readonly projectRoot: string;
  /** Concrete configuration variant being run. */
  readonly variant: PlayableVariant;
}

export interface GeneratedAssetsBoundaryPluginOptions {
  /** Sole module permitted to import the physical generated registry. */
  readonly allowedImporter?: string;
  /** Absolute path of the physical generated registry. */
  readonly assetsModule: string;
}

export interface GeneratedAssetsPluginOptions {
  /** Absolute path of the generated module containing ordinary asset imports. */
  readonly assetsModule: string;
  /** Network-owned decision to embed files or emit resource URLs. */
  readonly mode: AssetMode;
}

/** Runtime representation selected for one generated asset import. */
export type GeneratedImportKind = 'binary' | 'json' | 'text';
