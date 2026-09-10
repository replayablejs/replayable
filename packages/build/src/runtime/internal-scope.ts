import type { RuntimeDefinition } from '@replayablejs/runtime';
import type { Assets } from '@replayablejs/runtime/assets';

import type { ReplayableInternalScope } from '#types/runtime.js';

const INTERNAL_SCOPE_PROPERTY = '__REPLAYABLE_INTERNAL__';

const replayableGlobal: typeof globalThis & {
  [INTERNAL_SCOPE_PROPERTY]?: ReplayableInternalScope;
} = globalThis;

/** Registers the network host selected for the application that follows. */
export function registerHost(host: object): void {
  resolveInternalScope().host = host;
}

/** Registers the resolved runtime definition for the application that follows. */
export function registerDefinition(definition: RuntimeDefinition): void {
  resolveInternalScope().definition = definition;
}

/** Registers the generated asset registry for the application that follows. */
export function registerAssets(assets: Assets): void {
  resolveInternalScope().assets = assets;
}

/** Returns the registered host or reports that script execution occurred out of order. */
export function requireHost(): object {
  const { host } = resolveInternalScope();

  if (host === undefined) {
    throw new Error('Replayable host was accessed before the host entry executed.');
  }

  return host;
}

/** Returns the runtime definition or reports that script execution occurred out of order. */
export function requireDefinition(): RuntimeDefinition {
  const { definition } = resolveInternalScope();

  if (definition === undefined) {
    throw new Error('Replayable runtime definition was accessed before the config entry executed.');
  }

  return definition;
}

/** Returns registered assets or reports that script execution occurred out of order. */
export function requireAssets(): Assets {
  const { assets } = resolveInternalScope();

  if (assets === undefined) {
    throw new Error('Replayable assets were accessed before the assets entry executed.');
  }

  return assets;
}

/**
 * Returns the one private scope shared by independently bundled Replayable scripts.
 *
 * The global property itself cannot be replaced or enumerated, while its object
 * remains mutable so the host, config, and assets entries can register in sequence.
 */
function resolveInternalScope(): ReplayableInternalScope {
  const existingScope = replayableGlobal[INTERNAL_SCOPE_PROPERTY];

  if (existingScope !== undefined) {
    return existingScope;
  }

  const scope: ReplayableInternalScope = {};

  Object.defineProperty(replayableGlobal, INTERNAL_SCOPE_PROPERTY, {
    configurable: false,
    enumerable: false,
    value: scope,
    writable: false,
  });

  return scope;
}
