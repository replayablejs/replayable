import type { RuntimeDefinition } from '@replayablejs/runtime';

import { registerDefinition } from '../internal-scope.js';

declare const REPLAYABLE_RUNTIME_DEFINITION: Pick<RuntimeDefinition, 'assetMode' | 'config'>;

const { store } = REPLAYABLE_RUNTIME_DEFINITION.config;
const storeUrl = /Android/i.test(navigator.userAgent) ? store.androidUrl : store.iosUrl;

/** Registers browser-resolved configuration before the authored application evaluates. */
registerDefinition({
  ...REPLAYABLE_RUNTIME_DEFINITION,
  storeUrl,
});
