import {
  animate as motionAnimate,
  type AnimationOptions,
  type AnimationPlaybackControlsWithThen,
  type AnimationSequence,
  type DOMKeyframesDefinition,
  type ElementOrSelector,
  type MotionValue,
  type ObjectTarget,
  type SequenceOptions,
  type UnresolvedValueKeyframe,
  type ValueAnimationTransition,
} from 'motion';

import { getTweenLifecycle } from '#lifecycle/create-tween-lifecycle.js';
import type { TweenPlaybackControls } from '#types/playback.js';

/**
 * Animates values through Motion while applying Replayable's host lifecycle.
 *
 * The overloads intentionally mirror Motion's hybrid `animate()` function:
 * sequences, individual values, Motion values, DOM/SVG targets, and plain
 * objects all retain their native keyframe and option inference. Only the
 * returned controls are narrowed to Replayable's stable public contract.
 *
 * @throws When called before `await playable.ready()`.
 */
export function animate(
  sequence: AnimationSequence,
  options?: SequenceOptions,
): TweenPlaybackControls;
export function animate(
  value: string | MotionValue<string>,
  keyframes: string | UnresolvedValueKeyframe<string>[],
  options?: ValueAnimationTransition<string>,
): TweenPlaybackControls;
export function animate(
  value: number | MotionValue<number>,
  keyframes: number | UnresolvedValueKeyframe<number>[],
  options?: ValueAnimationTransition<number>,
): TweenPlaybackControls;
export function animate<Value extends string | number>(
  value: Value | MotionValue<Value>,
  keyframes: Value | UnresolvedValueKeyframe<Value>[],
  options?: ValueAnimationTransition<Value>,
): TweenPlaybackControls;
export function animate(
  element: ElementOrSelector,
  keyframes: DOMKeyframesDefinition,
  options?: AnimationOptions,
): TweenPlaybackControls;
export function animate<Object extends object>(
  object: Object | Object[],
  keyframes: ObjectTarget<Object>,
  options?: AnimationOptions,
): TweenPlaybackControls;
export function animate(
  subjectOrSequence: unknown,
  keyframesOrOptions?: unknown,
  options?: unknown,
): TweenPlaybackControls {
  // Readiness is checked before Motion creates a running animation, ensuring a
  // rejected early call cannot leave untracked browser work behind.
  const lifecycle = getTweenLifecycle();
  const motionControls: AnimationPlaybackControlsWithThen = Reflect.apply(
    motionAnimate,
    undefined,
    [subjectOrSequence, keyframesOrOptions, options],
  );

  return lifecycle.manage(motionControls);
}
