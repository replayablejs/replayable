/** Stable DOM references belong to their feature, not to the entire scene. */
export interface BoardView {
  readonly puzzlePanel: HTMLElement;
  readonly progress: HTMLProgressElement;
  readonly cellsByWord: ReadonlyMap<string, readonly HTMLElement[]>;
}

export interface WheelView {
  readonly currentWord: HTMLOutputElement;
  readonly selectionLine: SVGPolylineElement;
  readonly letterWheel: HTMLElement;
  readonly letterButtons: ReadonlyMap<string, HTMLButtonElement>;
}

export interface EndCardView {
  readonly endCard: HTMLElement;
  readonly endCardTitle: HTMLHeadingElement;
  readonly ctaButton: HTMLButtonElement;
  readonly ctaShine: HTMLElement;
}
