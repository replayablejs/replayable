import type { ManagedTween, ManagedTweenRegistry, TweenTermination } from '#types/lifecycle.js';
import type { MotionAnimation, MotionPlaybackControls } from '#types/motion-playback.js';
import type { TweenPlaybackControls } from '#types/playback.js';

/**
 * Wraps one Motion animation while preserving playback intent across visibility.
 *
 * Visibility retains only running children; finished children stay finished.
 * An explicit hidden-time `play()` instead requests playback of the whole group.
 * Manual pause or termination clears both forms of deferred playback intent.
 */
export function createManagedTween(
  motionControls: MotionPlaybackControls,
  animations: readonly MotionAnimation[],
  isVisible: () => boolean,
  registry: ManagedTweenRegistry,
): ManagedTween {
  const pausedForVisibility = new Set<MotionAnimation>();
  let playWhenVisible = false;
  let stopped = false;

  return {
    get hasDeferredPlay(): boolean {
      return playWhenVisible;
    },
    controls: {
      get duration(): number {
        return motionControls.duration;
      },

      get speed(): number {
        return motionControls.speed;
      },

      set speed(speed: number) {
        motionControls.speed = speed;
      },

      get time(): number {
        return motionControls.time;
      },

      set time(time: number) {
        motionControls.time = time;
      },

      cancel(): void {
        terminate('cancel');
      },

      complete(): void {
        terminate('complete');
      },

      pause(): void {
        clearVisibilityIntent();
        motionControls.pause();
      },

      play(): void {
        // Motion permanently detaches stopped animations; a later play() is a
        // no-op and must not reintroduce dead controls into the active registry.
        if (stopped) {
          return;
        }

        if (!isVisible()) {
          playWhenVisible = true;
          registry.retain();
          return;
        }

        clearVisibilityIntent();
        motionControls.play();
        registry.trackPlayback();
      },

      stop(): void {
        stopped = true;
        terminate('stop');
      },

      then(onResolve, onReject): Promise<void> {
        return motionControls.then(onResolve, onReject);
      },
    } satisfies TweenPlaybackControls,

    /** Pauses a running tween without changing the application's play intent. */
    pauseForVisibility(): void {
      for (const animation of animations) {
        if (animation.state === 'running') {
          animation.pause();
          pausedForVisibility.add(animation);
        }
      }
    },

    /** Resumes only playback that Replayable deferred because the host was hidden. */
    resumeFromVisibility(): void {
      if (playWhenVisible) {
        clearVisibilityIntent();
        motionControls.play();
        registry.trackPlayback();
        return;
      }

      if (pausedForVisibility.size === 0) {
        return;
      }

      for (const animation of pausedForVisibility) {
        animation.play();
      }
      pausedForVisibility.clear();
      registry.trackPlayback();
    },
  };

  /** Removes deferred intent before invoking any potentially reentrant Motion callback. */
  function clearVisibilityIntent(): void {
    playWhenVisible = false;
    pausedForVisibility.clear();
  }

  /**
   * Attempts every child before releasing registry ownership. A throwing Motion
   * callback must not skip later children or retain this terminated tween.
   */
  function terminate(operation: TweenTermination): void {
    clearVisibilityIntent();
    const errors: unknown[] = [];
    for (const animation of animations) {
      try {
        animation[operation]();
      } catch (error) {
        errors.push(error);
      }
    }
    registry.release();

    if (errors.length === 1) {
      throw errors[0];
    }
    if (errors.length > 1) {
      throw new AggregateError(errors, `Unable to ${operation} every tween animation.`);
    }
  }
}
