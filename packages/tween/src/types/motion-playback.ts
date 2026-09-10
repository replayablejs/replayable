import type { AnimationPlaybackControlsWithThen } from 'motion';

/** Motion controls used internally by Replayable's lifecycle wrapper. */
export type MotionAnimation = Pick<
  AnimationPlaybackControlsWithThen,
  | 'cancel'
  | 'complete'
  | 'duration'
  | 'finished'
  | 'pause'
  | 'play'
  | 'speed'
  | 'state'
  | 'stop'
  | 'time'
> & {
  /** Motion groups expose their children; group state describes only the first. */
  readonly animations?: readonly MotionAnimation[];
};

/** Top-level Motion controls retain their native promise-like behavior. */
export type MotionPlaybackControls = MotionAnimation &
  Pick<AnimationPlaybackControlsWithThen, 'then'>;
