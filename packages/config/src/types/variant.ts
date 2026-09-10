import type { AssetConfig } from '@replayablejs/assets';

import type { ReplayableConfig, ReplayableNetwork, ReplayableParamValue } from './config.js';

/** Values one version or network can replace in a concrete playable variant. */
export type VariantOverride = ReplayableConfig['versions'][string];

/** One concrete version, network, and language combination. */
export interface PlayableVariant {
  readonly assets: AssetConfig;
  readonly audio: boolean;
  readonly backgroundColor: string;
  readonly completion: Readonly<ReplayableConfig['completion']>;
  /** Preview preferences; ad-network profiles replace these during build resolution. */
  readonly controls: Readonly<ReplayableConfig['controls']>;
  readonly devtools: Readonly<ReplayableConfig['devtools']>;
  readonly entry: string;
  readonly id: string;
  readonly localization: {
    readonly language: string;
    readonly fallback: string;
  };
  readonly network: ReplayableNetwork;
  readonly params: Readonly<Record<string, ReplayableParamValue>>;
  readonly projectName: string;
  readonly screen: Readonly<ReplayableConfig['screen']>;
  readonly store: Readonly<ReplayableConfig['store']>;
  readonly version: string;
}

/** Concrete dimension selection used while expanding a playable variant. */
export interface VariantSelection {
  readonly language: string;
  readonly network: PlayableVariant['network'];
  readonly networkOverride: VariantOverride;
  readonly version: string;
  readonly versionOverride: VariantOverride;
}
