import type { StatsWebglContext, StatsWebglCounts, StatsWebglTracker } from '#types/webgl.js';

import { failStatsSetup, runStatsCleanup } from '../lifecycle/run-stats-cleanup.js';
import { observeWebglMethod } from './observe-webgl-method.js';

const trackers = new WeakMap<StatsWebglContext, StatsWebglTracker>();

/**
 * Instruments one renderer-created context, reusing it when renderers share it.
 * No scheduling, context creation, GPU queries, or renderer knowledge lives here.
 * The later sampling lifecycle owns this tracker and calls collect after rendering.
 */
export function createWebglTracker(context: StatsWebglContext): StatsWebglTracker {
  const existing = trackers.get(context);
  if (existing !== undefined) {
    return existing;
  }

  let drawCalls = 0;
  let textureBinds = 0;
  let programUses = 0;
  const restoreMethods: (() => void)[] = [];
  const tracker: StatsWebglTracker = { collect, reset, destroy };

  // A failed installation must not leave a partly patched rendering context.
  try {
    observeDrawMethods();
    observe(context, 'bindTexture', recordTextureBind);
    observe(context, 'useProgram', recordProgramUse);
    observeExtensions();
  } catch (error) {
    return failStatsSetup(error, destroy);
  }

  trackers.set(context, tracker);
  return tracker;

  /** Instanced submissions count once, regardless of how many instances they draw. */
  function observeDrawMethods(): void {
    for (const name of [
      'drawArrays',
      'drawElements',
      'drawRangeElements',
      'drawArraysInstanced',
      'drawElementsInstanced',
    ]) {
      observe(context, name, recordDraw);
    }
  }

  /**
   * Retrieve extension objects once so already-cached objects are instrumented too.
   * This enables supported extensions, but never creates a WebGL context. Native
   * extension objects are reused by getExtension; unsupported ones return null.
   * A function copied/bound before installation cannot be intercepted retroactively.
   * https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_multi_draw
   */
  function observeExtensions(): void {
    const instancing: unknown = context.getExtension('ANGLE_instanced_arrays');
    if (typeof instancing === 'object' && instancing !== null) {
      observe(instancing, 'drawArraysInstancedANGLE', recordDraw);
      observe(instancing, 'drawElementsInstancedANGLE', recordDraw);
    }

    const multiDraw: unknown = context.getExtension('WEBGL_multi_draw');
    if (typeof multiDraw === 'object' && multiDraw !== null) {
      observe(multiDraw, 'multiDrawArraysWEBGL', (args) => recordMultiDraw(args[5]));
      observe(multiDraw, 'multiDrawElementsWEBGL', (args) => recordMultiDraw(args[6]));
      observe(multiDraw, 'multiDrawArraysInstancedWEBGL', (args) => recordMultiDraw(args[7]));
      observe(multiDraw, 'multiDrawElementsInstancedWEBGL', (args) => recordMultiDraw(args[8]));
    }
  }

  /** Keeps installation and cleanup paired for both context and extension methods. */
  function observe(target: object, name: string, record: (args: readonly unknown[]) => void): void {
    restoreMethods.push(observeWebglMethod(target, name, record));
  }

  /** One ordinary API submission, including zero-count draws; no GPU success claim. */
  function recordDraw(): void {
    drawCalls += 1;
  }

  /** Reads the signature's drawcount, ignoring extra arguments as WebGL does. */
  function recordMultiDraw(count: unknown): void {
    // Do not coerce user objects a second time or let invalid counts poison stats.
    if (typeof count === 'number' && Number.isInteger(count) && count > 0) {
      drawCalls += count;
    }
  }

  /** Repeated bindings and null unbindings are still API calls. */
  function recordTextureBind(): void {
    textureBinds += 1;
  }

  /** Counts useProgram calls, not unique programs or successful shader switches. */
  function recordProgramUse(): void {
    programUses += 1;
  }

  /** Allocate only at the caller's sampling boundary, never a snapshot per GL call. */
  function collect(): StatsWebglCounts {
    const counts = { drawCalls, textureBinds, programUses };
    reset();
    return counts;
  }

  /** Discards a partial frame without changing the installed wrappers. */
  function reset(): void {
    drawCalls = 0;
    textureBinds = 0;
    programUses = 0;
  }

  /** Idempotent cleanup; stale owners cannot remove a newer tracker. */
  function destroy(): void {
    // Drain ownership first: even an unrestorable method must not prevent the
    // other wrappers from being disabled, or retain this tracker in the cache.
    const restores = restoreMethods.splice(0).reverse();
    reset();
    if (trackers.get(context) === tracker) {
      trackers.delete(context);
    }
    runStatsCleanup(restores);
  }
}
