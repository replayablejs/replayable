import type { AssetMode } from '#types/assets.js';
import type { PlayableAudio, RuntimeAudioState } from '#types/audio.js';
import type {
  PlayableCompletion,
  PlayableCompletionReason,
  RuntimeCompletionConfig,
} from '#types/completion.js';
import type { RuntimeControlsConfig } from '#types/controls.js';
import type { RuntimeDevtoolsConfig } from '#types/devtools.js';
import type { RuntimeEndCardConfig } from '#types/end-card.js';
import type { AssetLoader } from '#types/loader.js';
import type { Localization } from '#types/localization.js';
import type {
  RuntimeOrientation,
  RuntimeScreenConfig,
  RuntimeViewport,
  Screen,
} from '#types/screen.js';
import type { PlayableTimers } from '#types/timers.js';
import type {
  FixedUpdateContext,
  PostRenderContext,
  UpdateChannel,
  UpdateContext,
} from '#types/update.js';

/** Resolved, browser-safe configuration for the active playable variant. */
export interface RuntimeConfig {
  /** Whether this concrete playable variant includes runtime audio capability. */
  readonly audio: boolean;
  /** First-paint color retained behind the playable's mounted content. */
  readonly backgroundColor: string;
  readonly completion: RuntimeCompletionConfig;
  /** Resolved preview preferences or ad-network policy, with sound gated by audio capability. */
  readonly controls: RuntimeControlsConfig;
  readonly devtools: RuntimeDevtoolsConfig;
  readonly endCard: RuntimeEndCardConfig;
  readonly id: string;
  readonly localization: RuntimeLocalizationConfig;
  readonly network: RuntimeNetwork;
  readonly params: Readonly<Record<string, RuntimeParamValue>>;
  readonly screen: RuntimeScreenConfig;
  readonly store: RuntimeStoreConfig;
  readonly version: string;
}

/** Fixed language selected for this playable build. */
export interface RuntimeLocalizationConfig {
  readonly language: string;
}

/** Delivery network selected for the active playable variant. */
export type RuntimeNetwork =
  | 'applovin'
  | 'google'
  | 'liftoff'
  | 'meta'
  | 'mintegral'
  | 'moloco'
  | 'preview'
  | 'unity';

/** Primitive value of one resolved playable parameter. */
export type RuntimeParamValue = boolean | number | string;

/** Resolved iOS and Android call-to-action destinations. */
export interface RuntimeStoreConfig {
  readonly androidUrl: string;
  readonly iosUrl: string;
}

/** Complete value injected into runtime by Replayable's Vite configuration. */
export interface RuntimeDefinition {
  /** Internal representation selected by the active network profile. */
  readonly assetMode: AssetMode;
  readonly config: RuntimeConfig;
  /** Platform-specific call-to-action destination resolved by the config entry. */
  readonly storeUrl: string;
}

/** Complete normalized lifecycle state available to playable code. */
export interface RuntimeState {
  readonly audio: RuntimeAudioState;
  /** Terminal outcome, or `undefined` while the playable remains active. */
  readonly completion: PlayableCompletion | undefined;
  /** Whether the user has interacted with the playable at least once. */
  readonly interacted: boolean;
  readonly orientation: RuntimeOrientation;
  /** Whether the host currently considers the playable viewable. */
  readonly visible: boolean;
  readonly viewport: RuntimeViewport;
}

/** Values delivered by each public runtime lifecycle event. */
export interface RuntimeEventMap {
  audiochange: RuntimeAudioState;
  complete: PlayableCompletion;
  interaction: true;
  resize: RuntimeViewport;
  visibilitychange: boolean;
}

/** Listener for one public runtime lifecycle event. */
export type RuntimeEventListener<Event extends keyof RuntimeEventMap> = (
  value: RuntimeEventMap[Event],
) => void;

/** Public API for the playable currently running in the browser. */
export interface Playable {
  /** Initializes the selected host and loads the primary asset bundle once. */
  ready(): Promise<void>;
  /** Resolved configuration for the active playable variant. */
  readonly config: RuntimeConfig;
  /** Latest normalized lifecycle state, available after `ready()` resolves. */
  readonly state: RuntimeState;

  /** Screen-sized element into which the playable mounts its content. */
  readonly container: HTMLElement;
  /** Current engine-neutral layout derived from runtime screen state. */
  readonly screen: Screen;
  /** Loads generated asset bundles and retains their runtime values. */
  readonly loader: AssetLoader;
  /** Resolves phrases from the translation dictionary loaded through `loader`. */
  readonly localization: Localization;
  /** Plays sounds through Replayable's capability-aware audio facade. */
  readonly audio: PlayableAudio;
  /** Creates application-owned timers synchronized with visible runtime time. */
  readonly timers: PlayableTimers;

  /** Delivers one variable update for every rendered browser frame. */
  readonly update: UpdateChannel<UpdateContext>;
  /** Delivers fixed simulation steps at 60 updates per second. */
  readonly fixedUpdate: UpdateChannel<FixedUpdateContext>;
  /**
   * Runs after Motion's update and render phases, with one shared frame timestamp.
   * Follows readiness and visibility; listeners keep the runtime frame loop active.
   * This observes JavaScript rendering submissions, not GPU completion or browser paint.
   *
   * @example
   * const remove = playable.postRender.add(({ timestamp }) => {
   *   // Read rendering diagnostics after Pixi/Three have submitted their draws.
   *   console.log(timestamp);
   * });
   * remove();
   */
  readonly postRender: UpdateChannel<PostRenderContext>;
  /**
   * Subscribes to one lifecycle event.
   *
   * @returns A function that removes this listener.
   */
  on<Event extends keyof RuntimeEventMap>(
    event: Event,
    listener: RuntimeEventListener<Event>,
  ): () => void;

  /** Commits the playable's terminal outcome exactly once. */
  complete(reason: PlayableCompletionReason): void;
  /** Opens the resolved app-store destination through the active host. */
  openStore(): void;
}
