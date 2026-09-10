/** Renderer-created context identity; devtools never creates a context. */
export type StatsWebglContext = WebGLRenderingContext | WebGL2RenderingContext;

/** Receives the current registered contexts immediately and after registration changes. */
export type StatsWebglContextListener = (contexts: readonly StatsWebglContext[]) => void;

/** API submissions since the previous snapshot, not GPU completion or resource counts. */
export interface StatsWebglCounts {
  readonly drawCalls: number;
  readonly textureBinds: number;
  readonly programUses: number;
}

/** One context's instrumentation. Its owner decides when a frame ends. */
export interface StatsWebglTracker {
  /** Copies and clears counters; an idle tracked context returns zeroes. */
  collect(this: void): StatsWebglCounts;
  /** Discards partial counts without removing instrumentation. */
  reset(this: void): void;
  /** Restores owned methods and disables wrappers retained by another tool. */
  destroy(this: void): void;
}

/** Completed frame shared by every consumer; undefined counts mean no usable context. */
export type StatsWebglFrameListener = (
  timestamp: number,
  counts: StatsWebglCounts | undefined,
) => void;

/** Tracks one registered context across loss/restoration without owning the context. */
export interface StatsWebglContextSampling {
  collect(this: void): StatsWebglCounts | undefined;
  destroy(this: void): void;
}
