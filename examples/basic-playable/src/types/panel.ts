import type { BoardView, WheelView } from './view';
export interface Board extends BoardView {
  destroy(): void;
}
export interface LetterWheel extends WheelView {
  readonly wheelPanel: HTMLElement;
  destroy(): void;
}
