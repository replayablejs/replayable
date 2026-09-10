/** Public controls for one tween created through `@replayablejs/tween`. */
export interface TweenPlaybackControls {
  /** Current animation position in seconds. Assigning a value seeks the tween. */
  time: number;
  /** Playback-rate multiplier, where `1` is normal speed and `-1` plays in reverse. */
  speed: number;
  /** Total animation duration in seconds. */
  readonly duration: number;
  /** Resumes playback from the current position. */
  play(): void;
  /** Pauses playback at the current position. */
  pause(): void;
  /** Stops playback permanently at its current visual state. */
  stop(): void;
  /** Cancels playback and restores its initial state. */
  cancel(): void;
  /** Finishes playback immediately and applies its final state. */
  complete(): void;
  /**
   * Makes the controls awaitable and resolves after normal or forced completion.
   *
   * @example
   *
   * ```ts
   * const controls = animate(element, { opacity: 1 });
   * await controls;
   * ```
   */
  then(onResolve: () => void, onReject?: () => void): Promise<void>;
}
