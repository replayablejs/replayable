/** Network-resolved repetition policy for automatic end-card attention effects. */
export type EndCardAnimation = 'continuous' | 'finite';

/** Network-resolved interaction policy for a playable's terminal end card. */
export type EndCardInteraction = 'cta-only' | 'full-screen';

/** Browser-safe end-card behavior injected by the active network profile. */
export interface RuntimeEndCardConfig {
  /** Determines whether automatic end-card attention effects may repeat continuously. */
  readonly animation: EndCardAnimation;
  /**
   * Determines whether store exits are accepted only from the explicit CTA or
   * from any primary pointer interaction inside the visible end card.
   */
  readonly interaction: EndCardInteraction;
}
