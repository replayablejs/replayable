import type { Assets } from '#types/assets.js';
import type { HostAdapter } from '#types/host-adapter.js';
import type { RuntimeDefinition, RuntimeEventMap, RuntimeEventListener } from '#types/runtime.js';

/** Build-selected dependencies used to initialize one runtime instance. */
export interface CreateRuntimeOptions {
  readonly adapter: HostAdapter;
  readonly assets: Assets;
  readonly definition: RuntimeDefinition;
}

/** Listener storage that preserves each event's concrete payload type. */
export type RuntimeListeners = {
  [Event in keyof RuntimeEventMap]: Set<RuntimeEventListener<Event>>;
};
