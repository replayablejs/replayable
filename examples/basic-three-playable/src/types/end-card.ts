import type { EndCardAnimation } from '@replayablejs/runtime';

export interface EndCardEntranceConfig {
  readonly backdrop: HTMLElement;
  readonly button: HTMLButtonElement;
  readonly animation: EndCardAnimation;
}
