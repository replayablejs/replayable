/** One completed wheel gesture before gameplay decides whether it is a word. */
export interface LetterSelection {
  readonly letterIds: readonly string[];
  readonly word: string;
}

/** Controls the lifetime and availability of the letter-wheel gesture. */
export interface LetterWheelInput {
  dispose(): void;
  /** Cancels the gesture and releases capture without submitting its selected letters. */
  reset(): void;
  setEnabled(enabled: boolean): void;
}

/** Receives one non-empty selection when its pointer gesture ends. */
export type LetterSelectionHandler = (selection: LetterSelection) => void;

/** Application callbacks emitted by one mobile letter-wheel gesture. */
export interface LetterWheelInputOptions {
  readonly onSelection: LetterSelectionHandler;
  readonly onVisit?: () => void;
}

export interface SelectableLetter {
  readonly button: HTMLButtonElement;
  readonly id: string;
  readonly value: string;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Maps viewport pixels into the fixed coordinate system authored by the wheel SVG. */
export interface WheelCoordinates {
  readonly origin: Point;
  readonly scale: Point;
}
