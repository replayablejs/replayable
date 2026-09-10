import type { Stats } from '#types/stats.js';

/** Shared inert controls: disabled stats allocate no DOM or subscriptions. */
export const disabledStats: Stats = {
  show: doNothing,
  hide: doNothing,
  destroy: doNothing,
};

function doNothing(): void {}
