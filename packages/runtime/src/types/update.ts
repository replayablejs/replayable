/** A subscription channel driven by Replayable's runtime update loop. */
export interface UpdateChannel<Context> {
  /**
   * Adds a listener to the channel.
   *
   * @returns A function that removes this listener.
   */
  add(listener: (context: Context) => void): () => void;
}

/** Timing values delivered once for every rendered browser frame. */
export interface UpdateContext {
  /** Active runtime time advanced by this frame, measured in seconds. */
  readonly deltaSeconds: number;
  /**
   * Progress toward the next fixed update, from 0 inclusive to 1 exclusive.
   *
   * A value of 0 is exactly on a fixed-step boundary, 0.5 is halfway toward
   * the next step, and a value near 1 means another fixed update is almost due.
   * It is 0 on the first frame, after resuming, and without fixed listeners.
   */
  readonly fixedInterpolation: number;
}

/** Delivered after Motion's update and render phases, not after GPU completion or browser paint. */
export interface PostRenderContext {
  /** Shared Motion frame timestamp in milliseconds; suitable for real frame intervals and identity. */
  readonly timestamp: number;
}

/** Timing values delivered for one fixed simulation step. */
export interface FixedUpdateContext {
  /** Constant duration of this simulation step, measured in seconds. */
  readonly deltaSeconds: number;
}

/** Receives one value from an internal update dispatch. */
export type UpdateListener<Context> = (context: Context) => void;

/**
 * Internal controls retained alongside one public update subscription channel.
 *
 * Consumers receive only `add()`. The runtime keeps `dispatch()` to deliver
 * values and `hasListeners()` to decide whether browser frames are necessary.
 */
export interface UpdateChannelController<Context> extends UpdateChannel<Context> {
  /**
   * Delivers one value to the exact listener snapshot present when dispatch
   * begins. Subscription changes take effect on the following dispatch.
   */
  dispatch(context: Context): void;
  /** Reports whether at least one consumer currently requires this channel. */
  hasListeners(): boolean;
}

/** Receives one completed, constant-duration simulation step. */
export type FixedUpdateCallback = (context: FixedUpdateContext) => void;

/**
 * Converts variable browser-frame durations into constant simulation steps.
 *
 * This controller knows nothing about listeners, visibility, Motion, or the
 * DOM. Its caller supplies elapsed time and decides where each completed fixed
 * step is delivered.
 */
export interface FixedStepAccumulator {
  /**
   * Accumulates elapsed time and invokes `update` for every permitted fixed
   * step currently due.
   *
   * @returns The incomplete fraction remaining toward the next fixed step,
   * from 0 inclusive to 1 exclusive.
   */
  advance(deltaSeconds: number, update: FixedUpdateCallback): number;
  /**
   * Discards the incomplete fixed step without undoing simulation work that
   * was already delivered.
   */
  clearPendingTime(): void;
}

/**
 * Connects fixed-step timing to its public listener channel.
 *
 * The accumulator decides how many 1/60-second simulation steps are due. The
 * channel delivers each completed step to consumers. Keeping those concerns
 * separate lets the runtime start and stop browser frames based on listener
 * demand without putting subscription logic inside the time accumulator.
 */
export interface FixedUpdate {
  /** Public channel exposed as `playable.fixedUpdate`. */
  readonly channel: UpdateChannel<FixedUpdateContext>;
  /**
   * Adds one browser frame's elapsed time, dispatches due fixed steps, and
   * returns the remaining fractional step used for render interpolation.
   */
  advance(deltaSeconds: number): number;
  /** Discards a partial fixed step when scheduling pauses or becomes inactive. */
  clearPendingTime(): void;
  /** Reports whether fixed simulation currently requires browser frames. */
  hasListeners(): boolean;
}

/** Receives real, unclamped elapsed seconds from the frame scheduler. */
export type FrameUpdateCallback = (deltaSeconds: number) => void;

/** Minimal controls around Motion's browser-frame scheduling. */
export interface FrameScheduler {
  /** Starts delivering one real elapsed duration per rendered frame. */
  start(): void;
  /** Cancels delivery; the next start establishes a fresh timestamp baseline. */
  stop(): void;
}

/**
 * Delivers one variable update for each rendered browser frame.
 *
 * Unlike fixed simulation, this channel does not accumulate time or produce
 * multiple callbacks. It converts one scheduler frame into at most one public
 * `playable.update` callback per listener.
 */
export interface FrameUpdate {
  /** Public channel exposed as `playable.update`. */
  readonly channel: UpdateChannel<UpdateContext>;
  /**
   * Caps a browser frame's elapsed time and delivers it together with fixed
   * simulation interpolation.
   */
  advance(deltaSeconds: number, fixedInterpolation: number): void;
  /** Reports whether variable rendering currently requires browser frames. */
  hasListeners(): boolean;
}

/** Runtime lifecycle controls, simulation updates, and the post-render phase. */
export interface RuntimeUpdates {
  /** Internal raw visible-time channel used by lifecycle-aware timers. */
  readonly activeTime: UpdateChannel<number>;
  readonly fixedUpdate: UpdateChannel<FixedUpdateContext>;
  readonly update: UpdateChannel<UpdateContext>;
  readonly postRender: UpdateChannel<PostRenderContext>;
  /** Allows scheduling after runtime initialization and primary asset loading. */
  markReady(): void;
  /** Applies the latest normalized host visibility. */
  setVisible(visible: boolean): void;
}
