import type { LetterSelection } from './input';
export interface Tutorial {
  readonly element: HTMLParagraphElement;
  /** Completed multi-letter gestures dismiss guidance; cancellation and taps do not. */
  handleSelection(this: void, selection: LetterSelection): void;
}
