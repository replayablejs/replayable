/** Development audio toggle. Runtime retains ownership of the mute preference. */
export interface SoundControl {
  /** Removes the button, styles, and runtime/input subscriptions. Safe to call again. */
  destroy(): void;
}
