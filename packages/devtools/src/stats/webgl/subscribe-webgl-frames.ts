import type {
  StatsWebglContext,
  StatsWebglContextSampling,
  StatsWebglFrameListener,
} from '#types/webgl.js';

import { failStatsSetup, runStatsCleanup } from '../lifecycle/run-stats-cleanup.js';
import { subscribeWebglContexts } from './context-registry.js';
import { createWebglContextSampling } from './create-webgl-context-sampling.js';

// All cards/stats instances share one frame snapshot. Collecting separately
// would reset counters before the other consumers could read the same frame.
const listeners = new Set<StatsWebglFrameListener>();
const contexts = new Map<StatsWebglContext, StatsWebglContextSampling>();
let collectedTimestamp: number | undefined;
let removeContextListener: (() => void) | undefined;

/**
 * Acquires frame sampling until the returned release is called (hide/destroy).
 * The first consumer installs instrumentation; the last release restores it.
 * Stats lifecycle releases consumers when hidden; this source owns no visibility policy.
 * Merely importing this module allocates no DOM, wrappers, or subscriptions.
 */
export function subscribeWebglFrames(listener: StatsWebglFrameListener): () => void {
  // Each subscription owns a distinct identity, even when callbacks are shared.
  const deliver: StatsWebglFrameListener = (timestamp, counts) => listener(timestamp, counts);
  listeners.add(deliver);
  if (listeners.size === 1) {
    try {
      startSampling();
    } catch (error) {
      return failStatsSetup(error, release);
    }
  }
  return release;

  /** Idempotent release; other visible stats instances keep their shared tracker. */
  function release(): void {
    if (!listeners.delete(deliver) || listeners.size !== 0) {
      return;
    }
    stopSampling();
  }
}

/** Replay existing contexts before the next update, or observe later registrations. */
function startSampling(): void {
  if (removeContextListener !== undefined) {
    return;
  }
  removeContextListener = subscribeWebglContexts(updateContexts);
}

/** Release every owned wrapper and context reference, invalidating the previous frame. */
function stopSampling(): void {
  collectedTimestamp = undefined;
  const unsubscribe = removeContextListener;
  removeContextListener = undefined;
  const samplings = [...contexts.values()];
  contexts.clear();
  runStatsCleanup([() => unsubscribe?.(), ...samplings.map((sampling) => sampling.destroy)]);
}

/** Registry snapshots already deduplicate contexts shared by Pixi and Three. */
function updateContexts(registered: readonly StatsWebglContext[]): void {
  const removals: (() => void)[] = [];
  for (const [context, sampling] of contexts) {
    if (!registered.includes(context)) {
      contexts.delete(context);
      removals.push(sampling.destroy);
    }
  }
  runStatsCleanup(removals);

  for (const context of registered) {
    if (!contexts.has(context)) {
      contexts.set(context, createWebglContextSampling(context));
    }
  }
}

/**
 * Called by metric sampling after rendering, never by an independent scheduler.
 * Motion's frame timestamp is shared across stats instances, unlike their local
 * performance.now() readings. It makes collection/reset happen once per frame.
 * Delivery updates all subscribed metrics before any instance collects its readings.
 */
export function collectWebglFrame(timestamp: number): void {
  if (removeContextListener === undefined || collectedTimestamp === timestamp) {
    return;
  }
  collectedTimestamp = timestamp;
  let available = false;
  let drawCalls = 0;
  let textureBinds = 0;
  let programUses = 0;
  for (const sampling of contexts.values()) {
    const counts = sampling.collect();
    if (counts !== undefined) {
      available = true;
      drawCalls += counts.drawCalls;
      textureBinds += counts.textureBinds;
      programUses += counts.programUses;
    }
  }
  const counts = available ? Object.freeze({ drawCalls, textureBinds, programUses }) : undefined;
  for (const listener of [...listeners]) {
    // A preceding callback can hide/destroy another stats instance during delivery.
    if (listeners.has(listener)) {
      listener(timestamp, counts);
    }
  }
}
