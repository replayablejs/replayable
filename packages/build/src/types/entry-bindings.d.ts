declare module '#generated-assets' {
  import type { Assets } from '@replayablejs/runtime/assets';

  /** Generated assets module selected for the active variant. */
  export const assets: Assets;
}

declare module '#selected-adapter' {
  /** Creates the network host selected for the active build profile. */
  export function createAdapter(): object;
}
