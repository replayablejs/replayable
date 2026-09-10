/** Available space in the text parent's local units, before parent/layout scaling. */
export interface FitTextOptions {
  readonly width: number;
  /** Omit when only horizontal fitting is needed. */
  readonly height?: number;
}
