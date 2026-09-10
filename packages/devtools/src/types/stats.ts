/** Lifecycle controls for the optional development stats shell. */
export interface Stats {
  /** Shows the shell and resumes measurements; inert after destruction. */
  show(): void;
  /** Hides the shell and unsubscribes from measurements. */
  hide(): void;
  /** Permanently releases the shell and its subscriptions. Safe to call again. */
  destroy(): void;
}
