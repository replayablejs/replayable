import type { MotionPlaybackControls } from './motion-playback.js';
import type { TweenPlaybackControls } from './playback.js';

/** Runtime visibility surface required by the optional tween package. */
export interface TweenRuntime {
  readonly state: { readonly visible: boolean };
  on(event: 'visibilitychange', listener: (visible: boolean) => void): () => void;
}

/** One document-lifetime registry of active or deferred tweens. */
export interface TweenLifecycle {
  manage(controls: MotionPlaybackControls): TweenPlaybackControls;
}

/** Registry operations invoked as one tween starts and terminates playback. */
export interface ManagedTweenRegistry {
  retain(): void;
  release(): void;
  trackPlayback(): void;
}

/** Internal lifecycle controls around one public tween handle. */
export interface ManagedTween {
  readonly controls: TweenPlaybackControls;
  /** An explicit play request waiting for visibility, possibly after completion. */
  readonly hasDeferredPlay: boolean;
  pauseForVisibility(): void;
  resumeFromVisibility(): void;
}

/** Observes each distinct set of child completion promises once. */
export interface PlaybackObserver {
  observe(): void;
  /** Invalidates callbacks belonging to terminated playback. */
  clear(): void;
}

/** Terminal Motion operations applied to every child even when a callback throws. */
export type TweenTermination = 'cancel' | 'complete' | 'stop';
