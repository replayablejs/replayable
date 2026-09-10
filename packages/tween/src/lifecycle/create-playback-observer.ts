import type { PlaybackObserver } from '#types/lifecycle.js';
import type { MotionAnimation } from '#types/motion-playback.js';

/**
 * Observes child completion promises, not Motion's fresh aggregate per getter.
 * Pausing/resuming keeps these promises, so it adds no completion subscriptions.
 * Replaying a finished child replaces its promise and starts a new observation.
 */
export function createPlaybackObserver(
  animations: readonly MotionAnimation[],
  onComplete: () => void,
): PlaybackObserver {
  let observed: readonly Promise<void>[] | undefined;

  return { observe, clear };

  /** Subscribes only when at least one child has entered a new playback cycle. */
  function observe(): void {
    const completions = animations.map((animation) => animation.finished);
    if (observed?.every((completion, index) => completion === completions[index])) {
      return;
    }

    observed = completions;
    void Promise.all(completions).then(handleComplete, handleComplete);

    /** An older playback must never release a newer or explicitly terminated one. */
    function handleComplete(): void {
      if (observed !== completions) {
        return;
      }
      observed = undefined;
      onComplete();
    }
  }

  /** Discards ownership without trying to cancel Motion's native promises. */
  function clear(): void {
    observed = undefined;
  }
}
