/** Timestamp-driven sampling cadence; it never schedules browser frames or timers. */
export interface StatsSamplingClock {
  /** Discards pending intervals and starts a fresh baseline after a visibility gap. */
  reset(timestamp: number): void;
  /**
   * Delivers a frame before deciding whether to collect; its initial elapsed time is zero.
   * Returns true once per refresh window, and only when frame intervals exist.
   */
  advance(timestamp: number, onFrame: (deltaMilliseconds: number) => void): boolean;
}
