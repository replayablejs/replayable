/** Supported terminal outcomes reported by a playable. */
export type PlayableCompletionReason =
  | 'duration-timeout'
  | 'failure'
  | 'inactivity-timeout'
  | 'skip'
  | 'success';

/** Immutable terminal outcome committed by `playable.complete()`. */
export interface PlayableCompletion {
  readonly reason: PlayableCompletionReason;
}

/** Resolved automatic completion policy for the active playable variant. */
export interface RuntimeCompletionConfig {
  /** Maximum playable duration in seconds, when enabled. */
  readonly duration?: number;
  /** Network-owned point from which the duration timer begins advancing. */
  readonly durationStart: 'interaction' | 'ready';
  /** Allowed inactivity in seconds after the first interaction, when enabled. */
  readonly inactivity?: number;
}

export interface CompletionClock {
  remainingSeconds: number | undefined;
  running: boolean;
}

export type CompletionTimerLifecycle = 'active' | 'idle' | 'stopped';
