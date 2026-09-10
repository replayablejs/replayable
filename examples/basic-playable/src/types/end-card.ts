export type EndCardMessage = 'success' | 'timeout';
export interface EndCard {
  readonly container: HTMLElement;
  show(message: EndCardMessage): void;
  destroy(): void;
}
