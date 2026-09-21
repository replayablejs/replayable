import type { UpdateSubscription, UpdateChannelController } from '#types/update.js';

/**
 * Keeps a stable dispatch order without allocating an array on every frame.
 * Additions wait for the next dispatch. Removal marks the subscription inactive
 * immediately, so even an existing snapshot skips it before its turn.
 * Re-adding the same callback creates a new subscription; it cannot revive the old one.
 */
export function createUpdateChannel<Context>(
  onActivityChange: () => void,
): UpdateChannelController<Context> {
  let listeners: readonly UpdateSubscription<Context>[] = [];

  return {
    add(listener): () => void {
      // Duplicate registration must not produce duplicate updates or a second
      // removal handle for the same logical subscription.
      if (listeners.some((subscription) => subscription.listener === listener)) {
        return doNothing;
      }

      const wasEmpty = listeners.length === 0;
      const subscription = { listener, active: true };

      // Copy-on-write preserves any array currently being dispatched.
      listeners = [...listeners, subscription];

      // Only the first listener changes scheduler demand from inactive to active.
      if (wasEmpty) {
        onActivityChange();
      }

      return (): void => {
        // A caller may safely retain and invoke the removal function repeatedly.
        if (!subscription.active) {
          return;
        }

        subscription.active = false;
        // Copy-on-write also means removal cannot shorten an active iteration.
        listeners = listeners.filter((registered) => registered !== subscription);

        // Intermediate removals need no scheduler work while another listener remains.
        if (listeners.length === 0) {
          onActivityChange();
        }
      };
    },

    dispatch(context): void {
      for (const subscription of listeners) {
        if (subscription.active) {
          subscription.listener(context);
        }
      }
    },

    hasListeners(): boolean {
      return listeners.length > 0;
    },
  };
}

/** Stable no-op removal result for an ignored duplicate registration. */
function doNothing(): void {}
