/** Internal SVG presentation for one metric; it owns no sampling or scheduling. */
export interface StatsGraph {
  readonly element: SVGSVGElement;
  /** Current upper bound, retained even when history is cleared. */
  readonly ceiling: number;
  /** Observe every sample, including while a compact card is not displayed. */
  observe(value: number): void;
  /** Redraw existing nodes from oldest-to-newest history, without recording it. */
  render(history: readonly number[]): void;
}
