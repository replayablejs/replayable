declare module '#adapter' {
  import type { HostAdapter } from '#types/host-adapter.js';

  /** Creates the concrete host adapter selected by Replayable's build pipeline. */
  export function createAdapter(): HostAdapter;
}
