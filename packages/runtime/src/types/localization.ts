/** Runtime translation lookup over the dictionary loaded for a playable. */
export interface Localization {
  /** Fixed language selected for the current playable variant. */
  readonly language: string;
  /** Resolves one phrase using the selected language and configured fallback. */
  translate(phrase: string): string;
}
