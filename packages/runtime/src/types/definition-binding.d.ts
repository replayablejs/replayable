declare module '#definition' {
  import type { RuntimeDefinition } from '#types/runtime.js';

  /** Resolved runtime definition registered by Replayable's build pipeline. */
  export const definition: RuntimeDefinition;
}
