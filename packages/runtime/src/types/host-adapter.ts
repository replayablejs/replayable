import type { RuntimeViewport } from './screen.js';

/** Host-owned values captured after its SDK or browser environment becomes ready. */
export interface HostSnapshot {
  /** Host-provided volume normalized from silent (`0`) to full volume (`1`). */
  readonly volume: number;
  /** Whether the host currently considers the playable viewable. */
  readonly visible: boolean;
  /** Current dimensions of the ad container in CSS pixels. */
  readonly viewport: RuntimeViewport;
}

/** One host-owned lifecycle change reported after initialization. */
export type HostUpdate =
  | { readonly type: 'resize'; readonly viewport: RuntimeViewport }
  | { readonly type: 'visibilitychange'; readonly visible: boolean }
  | { readonly type: 'volumechange'; readonly volume: number };

/** Receives lifecycle changes from the active host adapter. */
export type HostUpdateListener = (update: HostUpdate) => void;

/**
 * Connects the runtime to one concrete hosting environment.
 *
 * Browser preview and advertising-network implementations provide the same
 * normalized facts, leaving runtime state and public events host-independent.
 */
export interface HostAdapter {
  /** Waits for the host and returns its first complete lifecycle snapshot. */
  initialize(listener: HostUpdateListener): Promise<HostSnapshot>;
  /** Notifies hosts that require an explicit terminal playable signal. */
  notifyComplete?(): void;
  /** Notifies hosts that require an explicit post-loading readiness signal. */
  notifyReady?(): void;
  /** Opens the supplied store destination through the hosting environment. */
  openStore(url: string): void;
}
