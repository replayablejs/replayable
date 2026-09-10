import type { LoadingIndicatorOwner, NetworkHtmlHead } from './network.js';

export interface PlayableHtmlInitializers {
  /** Generated assets registration executed after resolved configuration. */
  readonly assets: string;
  /** Resolved runtime configuration registration executed after the host. */
  readonly config: string;
  /** Network host registration executed before every other playable entry. */
  readonly host: string;
}

export interface PlayableHtmlResources {
  /** Authored application entry evaluated after optional initialization scripts. */
  readonly entry: string;
  readonly head: NetworkHtmlHead;
  /** Scripts that prepare the private runtime scope in development and production. */
  readonly initializers?: PlayableHtmlInitializers;
  readonly loadingIndicator: LoadingIndicatorOwner;
  readonly stylesheets: readonly string[];
}
