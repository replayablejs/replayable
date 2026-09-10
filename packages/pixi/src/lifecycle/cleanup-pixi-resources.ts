/** Releases acquired resources in reverse order, even when individual cleanup fails. */
export function cleanupPixiResources(cleanups: (() => void)[]): void {
  const errors = collectCleanupErrors(cleanups);

  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Pixi resource cleanup failed.');
  }
}

/** Preserves the original setup failure alongside any rollback failures. */
export function failPixiSetup(cause: unknown, cleanups: (() => void)[]): never {
  const errors = collectCleanupErrors(cleanups);

  if (errors.length === 0) {
    throw cause;
  }
  throw new AggregateError([cause, ...errors], 'Pixi setup and cleanup failed.', { cause });
}

/** Pops before calling so repeated cleanup never retries already released resources. */
function collectCleanupErrors(cleanups: (() => void)[]): unknown[] {
  const errors: unknown[] = [];
  let dispose = cleanups.pop();

  while (dispose !== undefined) {
    try {
      dispose();
    } catch (error) {
      errors.push(error);
    }
    dispose = cleanups.pop();
  }
  return errors;
}
