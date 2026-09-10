import type { RuntimeDefinition } from '@replayablejs/runtime';
import type { Assets } from '@replayablejs/runtime/assets';

/** Private browser entry emitted alongside the build package. */
export type BuildRuntimeEntry = 'assets' | 'config' | 'host';

/** Values registered before the authored application begins evaluating. */
export interface ReplayableInternalScope {
  /** Network-specific host adapter selected by the active build profile. */
  host?: object;
  /** Resolved runtime configuration prepared for the active playable variant. */
  definition?: RuntimeDefinition;
  /** Generated asset registry prepared for the active playable variant. */
  assets?: Assets;
}
