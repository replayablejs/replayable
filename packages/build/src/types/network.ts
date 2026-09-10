import type { PlayableVariant } from '@replayablejs/config';
import type {
  RuntimeCompletionConfig,
  RuntimeControlsConfig,
  RuntimeEndCardConfig,
} from '@replayablejs/runtime';
import type { AssetMode } from '@replayablejs/runtime/assets';

/** One network-required `<meta>` element rendered into the playable document head. */
export interface HtmlMetaTag {
  readonly name: string;
  readonly content: string;
}

/** One network-owned external script rendered into the playable document head. */
export interface HtmlScript {
  readonly src: string;
}

/** Resolved network-specific elements added to a production playable document. */
export interface NetworkHtmlHead {
  readonly metaTags: readonly HtmlMetaTag[];
  readonly scripts: readonly HtmlScript[];
}

/** Private runtime implementations selectable by the Replayable build pipeline. */
export type RuntimeHost =
  | 'applovin'
  | 'browser'
  | 'google'
  | 'liftoff'
  | 'meta'
  | 'mintegral'
  | 'moloco'
  | 'unity';

/** Identifies whether Replayable or the advertising host presents initial loading UI. */
export type LoadingIndicatorOwner = 'host' | 'replayable';

/** JavaScript artifact shape required before network-specific export packaging. */
export type ApplicationMode = 'single-module' | 'module-graph';

/** Fully resolved delivery policy consumed by Replayable's shared Vite pipeline. */
export interface PlayableProfile {
  /** Determines whether generated assets become data URLs or emitted resources. */
  readonly assetMode: AssetMode;
  /** Determines whether production emits one inline-ready script or an ESM chunk graph. */
  readonly applicationMode: ApplicationMode;
  /** Network-owned global replacements applied while compiling application code. */
  readonly compileTimeDefinitions: Readonly<Record<string, string>>;
  /** Determines whether playable duration begins at readiness or first interaction. */
  readonly completionDurationStart: RuntimeCompletionConfig['durationStart'];
  /** Determines which standardized controls the playable exposes during gameplay. */
  readonly controls: RuntimeControlsConfig;
  /** Determines which visible end-card area may open the store. */
  readonly endCard: RuntimeEndCardConfig;
  /** Network-owned elements added to the playable document head. */
  readonly htmlHead: NetworkHtmlHead;
  /** Determines which layer owns the visible loading presentation. */
  readonly loadingIndicator: LoadingIndicatorOwner;
  /** Private runtime adapter compiled into the playable. */
  readonly runtime: RuntimeHost;
}

export interface NetworkProfile {
  readonly assetMode: AssetMode;
  readonly applicationMode: PlayableProfile['applicationMode'];
  readonly compileTimeDefinitions: Readonly<Record<string, string>>;
  readonly completionDurationStart: PlayableProfile['completionDurationStart'];
  readonly controls: PlayableProfile['controls'];
  readonly endCard: PlayableProfile['endCard'];
  readonly loadingIndicator: PlayableProfile['loadingIndicator'];
  readonly resolveHtmlHead: (variant: PlayableVariant) => NetworkHtmlHead;
  readonly runtime: RuntimeHost;
}
