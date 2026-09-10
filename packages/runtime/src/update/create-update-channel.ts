import type { UpdateListener, UpdateChannelController } from '#types/update.js';

/**
 * Creates a copy-on-write subscription channel optimized for frequent dispatch.
 *
 * Adding and removing are relatively rare, so they replace the retained array.
 * Frame dispatch is frequent, so it iterates the existing array without cloning
 * it. Replacing instead of mutating means an in-progress dispatch keeps a stable
 * snapshot even when one of its listeners changes the channel.
 *
 * For example, if listeners A and B begin a dispatch and A removes B, B still
 * receives that current value. The next dispatch contains only A. Likewise, a
 * listener added by A begins receiving values on the next dispatch.
 *
 * Registering the same function twice follows `EventTarget`-style semantics:
 * the second registration is ignored. Removal functions are idempotent.
 * `onActivityChange` runs only for empty-to-active and active-to-empty
 * transitions, allowing the runtime to reevaluate frame scheduling without
 * reacting to every intermediate listener count.
 */
export function createUpdateChannel<Context>(
  onActivityChange: () => void,
): UpdateChannelController<Context> {
  let listeners: readonly UpdateListener<Context>[] = [];

  return {
    add(listener): () => void {
      // Duplicate registration must not produce duplicate updates or a second
      // removal handle for the same logical subscription.
      if (listeners.includes(listener)) {
        return doNothing;
      }

      const wasEmpty = listeners.length === 0;
      let subscribed = true;

      // Copy-on-write preserves any array currently being dispatched.
      listeners = [...listeners, listener];

      // Only the first listener changes scheduler demand from inactive to active.
      if (wasEmpty) {
        onActivityChange();
      }

      return (): void => {
        // A caller may safely retain and invoke the removal function repeatedly.
        if (!subscribed) {
          return;
        }

        subscribed = false;
        // Copy-on-write also means removal cannot shorten an active iteration.
        listeners = listeners.filter((registeredListener) => registeredListener !== listener);

        // Intermediate removals need no scheduler work while another listener remains.
        if (listeners.length === 0) {
          onActivityChange();
        }
      };
    },

    dispatch(context): void {
      // `listeners` is evaluated once when iteration starts. Reassignments made
      // by callbacks therefore affect future dispatches, not this snapshot.
      for (const listener of listeners) {
        listener(context);
      }
    },

    hasListeners(): boolean {
      return listeners.length > 0;
    },
  };
}

/** Stable no-op removal result for an ignored duplicate registration. */
function doNothing(): void {}
