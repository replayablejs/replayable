import { playable } from '@replayablejs/runtime';

import { createManagedTween } from '#lifecycle/create-managed-tween.js';
import { createPlaybackObserver } from '#lifecycle/create-playback-observer.js';
import { resolveMotionAnimations } from '#lifecycle/resolve-motion-animations.js';
import type { ManagedTween, TweenLifecycle, TweenRuntime } from '#types/lifecycle.js';
import type { MotionPlaybackControls } from '#types/motion-playback.js';
import type { TweenPlaybackControls } from '#types/playback.js';

let tweenLifecycle: TweenLifecycle | undefined;

/**
 * Returns the shared lifecycle registry, creating it on the first animation.
 *
 * `animate()` calls this before invoking Motion. The initial `playable.state`
 * read therefore rejects animation creation before `await playable.ready()`
 * without leaving an untracked Motion animation running in the background.
 */
export function getTweenLifecycle(): TweenLifecycle {
  tweenLifecycle ??= createTweenLifecycle(playable);

  return tweenLifecycle;
}

/**
 * Creates the lifecycle registry shared by every tween in one playable.
 *
 * Creation reads `playable.state`, which intentionally throws when application
 * code requests an animation before `await playable.ready()`. Its single
 * visibility subscription then lives with this singleton for the lifetime of
 * the playable; completed tweens are still removed from the active registry.
 */
export function createTweenLifecycle(runtime: TweenRuntime): TweenLifecycle {
  const managedTweens = new Set<ManagedTween>();
  let visible = runtime.state.visible;

  // A playable owns one lifecycle for its entire document lifetime. Retaining
  // this single listener is simpler than repeatedly subscribing between tweens.
  runtime.on('visibilitychange', handleVisibilityChange);

  return {
    /** Wraps one newly created Motion animation in Replayable's public controls. */
    manage(motionControls: MotionPlaybackControls): TweenPlaybackControls {
      const animations = resolveMotionAnimations(motionControls);
      const observer = createPlaybackObserver(animations, handleComplete);
      const managedTween = createManagedTween(motionControls, animations, () => visible, {
        release,
        retain,
        trackPlayback,
      });

      trackPlayback();

      if (!visible) {
        managedTween.pauseForVisibility();
      }

      return managedTween.controls;

      /** Deferred replay survives settlement of the previous playback cycle. */
      function handleComplete(): void {
        if (!managedTween.hasDeferredPlay) {
          release();
        }
      }

      /** Visibility deferral keeps ownership without adding completion observers. */
      function retain(): void {
        managedTweens.add(managedTween);
      }

      /** Retains playback and observes it only if its child promises changed. */
      function trackPlayback(): void {
        retain();
        observer.observe();
      }

      /** Invalidates older completion callbacks and forgets terminated playback. */
      function release(): void {
        observer.clear();
        managedTweens.delete(managedTween);
      }
    },
  };

  /** Applies one committed host-visibility transition to every active tween. */
  function handleVisibilityChange(nextVisible: boolean): void {
    visible = nextVisible;
    const operation = visible ? 'resumeFromVisibility' : 'pauseForVisibility';

    for (const managedTween of managedTweens) {
      managedTween[operation]();
    }
  }
}
