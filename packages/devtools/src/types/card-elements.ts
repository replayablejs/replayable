/** Reusable DOM references; creating them does not mount the card or manage its data. */
export interface StatsCardElements {
  readonly root: HTMLDivElement;
  readonly value: HTMLSpanElement;
  readonly range: HTMLSpanElement;
}
