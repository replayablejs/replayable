import type { MotionAnimation } from '#types/motion-playback.js';

/**
 * Resolves the individual animations behind Motion's public group controls.
 *
 * Motion 13 groups expose `animations`, but their `state` getter reports only
 * the first child. Lifecycle decisions must inspect children independently:
 * one property can finish while another continues or repeats indefinitely.
 * Keep this integration boundary aligned with Motion when upgrading it.
 */
export function resolveMotionAnimations(controls: MotionAnimation): readonly MotionAnimation[] {
  return controls.animations?.flatMap(resolveMotionAnimations) ?? [controls];
}
