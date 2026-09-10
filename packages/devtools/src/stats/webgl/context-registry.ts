import type { StatsWebglContext, StatsWebglContextListener } from '#types/webgl.js';

// Multiple owners may register the same context, but observers see it only once.
const registrations = new Map<StatsWebglContext, number>();
const listeners = new Set<StatsWebglContextListener>();

/** Registers an existing context and returns an idempotent release for this owner. */
export function registerWebglContext(context: StatsWebglContext): () => void {
  const count = registrations.get(context) ?? 0;
  registrations.set(context, count + 1);
  if (count === 0) {
    const errors = notifyListeners();
    if (errors.length > 0) {
      // No release handle reached the caller. Restore the registry and let
      // observers undo any instrumentation installed before another one failed.
      registrations.delete(context);
      errors.push(...notifyListeners());
      throw new AggregateError(errors, 'Failed to register the WebGL context.');
    }
  }

  let released = false;
  return unregister;

  /** Removes the context only after its last owner releases it. */
  function unregister(): void {
    if (released) {
      return;
    }
    released = true;

    const remaining = (registrations.get(context) ?? 1) - 1;
    if (remaining > 0) {
      registrations.set(context, remaining);
    } else {
      registrations.delete(context);
      const errors = notifyListeners();
      if (errors.length > 0) {
        throw new AggregateError(errors, 'Failed to notify WebGL context removal.');
      }
    }
  }
}

/** Late observers receive existing contexts; early observers receive later registrations. */
export function subscribeWebglContexts(listener: StatsWebglContextListener): () => void {
  listeners.add(listener);
  try {
    listener(contextSnapshot());
  } catch (error) {
    listeners.delete(listener);
    throw error;
  }

  return (): void => {
    listeners.delete(listener);
  };
}

/** Notify every observer, even if one fails, so cleanup never stops halfway through. */
function notifyListeners(): unknown[] {
  const contexts = contextSnapshot();
  const errors: unknown[] = [];
  for (const listener of [...listeners]) {
    try {
      listener(contexts);
    } catch (error) {
      errors.push(error);
    }
  }
  return errors;
}

/** Frozen snapshots prevent one observer from changing another observer's context list. */
function contextSnapshot(): readonly StatsWebglContext[] {
  return Object.freeze([...registrations.keys()]);
}
