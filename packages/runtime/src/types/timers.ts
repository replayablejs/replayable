import type { PlayableCompletionReason, RuntimeCompletionConfig } from '#types/completion.js';

/** Configuration for one application-owned inactivity timer. */
export interface InactivityTimerOptions {
  /** Inactive visible time in seconds before `onTimeout` runs. */
  readonly duration: number;
  /** Called once after the timer has stopped itself. */
  readonly onTimeout: () => void;
}

/** Controls one reusable application-owned inactivity timer. */
export interface InactivityTimer {
  /** Starts a stopped timer from its full duration; does nothing while already running. */
  start(): void;
  /** Resets the full duration and starts the timer when necessary. */
  restart(): void;
  /** Stops the timer and clears its elapsed inactivity. */
  stop(): void;
}

/** Internal inactivity timer contract used by the timer subsystem. */
export interface ManagedInactivityTimer extends InactivityTimer {
  /** Restores the full duration only while this timer is running. */
  resetForActivity(): void;
}

/** Application-owned timers synchronized with Replayable's visible-time clock. */
export interface PlayableTimers {
  /** Waits for the given amount of active visible time, measured in seconds. */
  delay(duration: number): Promise<void>;
  /** Creates a stopped timer that resets after every trusted user interaction. */
  createInactivityTimer(options: InactivityTimerOptions): InactivityTimer;
}

/** Minimal state boundary through which automatic timers commit completion. */
export interface CompletionTarget {
  applyCompletion(reason: PlayableCompletionReason): void;
}

/** Internal lifecycle controls for framework-owned completion timers. */
export interface CompletionTimers {
  /** Starts or resets inactivity after every trusted user activity. */
  recordActivity(): void;
  /** Starts duration when the active network gates it behind first interaction. */
  recordFirstInteraction(): void;
  /** Enables configured timers after runtime readiness. */
  start(alreadyInteracted: boolean): void;
  /** Permanently removes timer work after any terminal completion. */
  stop(): void;
}

export interface TimerController {
  /** Public timer factory exposed through `playable.timers`. */
  readonly timers: PlayableTimers;
  /** Creates framework-owned completion timers on the shared clock. */
  createCompletion(config: RuntimeCompletionConfig, target: CompletionTarget): CompletionTimers;
  /** Resets every running inactivity timer after trusted user activity. */
  recordActivity(): void;
}
