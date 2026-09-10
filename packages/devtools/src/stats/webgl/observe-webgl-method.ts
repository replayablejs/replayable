/**
 * Shadows a method on this context/extension only, leaving browser prototypes alone.
 * Observation happens after a normal return: thrown calls retain their exception
 * and are not counted. WebGL error flags are deliberately never queried.
 */
export function observeWebglMethod(
  target: object,
  name: string,
  observe: (args: readonly unknown[]) => void,
): () => void {
  const original: unknown = Reflect.get(target, name);
  if (typeof original !== 'function') {
    return noop;
  }
  const method = original;

  const descriptor = Object.getOwnPropertyDescriptor(target, name);
  let active = true;

  // Restoring the exact descriptor also preserves pre-existing instrumentation.
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: descriptor?.enumerable ?? false,
    writable: true,
    value: observedMethod,
  });

  return restore;

  /** Preserve the receiver, argument identities, return value, and native exceptions. */
  function observedMethod(this: unknown, ...args: unknown[]): unknown {
    const result: unknown = Reflect.apply(method, this, args);
    if (active) {
      observe(args);
    }
    return result;
  }

  /** Never overwrite a wrapper installed by another tool after ours. */
  function restore(): void {
    if (!active) {
      return;
    }
    active = false;
    if (Object.getOwnPropertyDescriptor(target, name)?.value !== observedMethod) {
      return;
    }
    if (descriptor === undefined) {
      if (!Reflect.deleteProperty(target, name)) {
        throw new TypeError(`Unable to remove the stats wrapper for ${name}.`);
      }
    } else {
      Object.defineProperty(target, name, descriptor);
    }
  }
}

/** Missing WebGL2/extension methods need no instrumentation or cleanup. */
function noop(): void {}
