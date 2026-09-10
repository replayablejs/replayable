import type { EndCardTrigger } from '#types/end-card-trigger.js';

const disabledTrigger: EndCardTrigger = { destroy(): void {} };

/** Production imports no runtime, DOM, styles, or keyboard listeners. */
export function createEndCardTrigger(): EndCardTrigger {
  return disabledTrigger;
}
