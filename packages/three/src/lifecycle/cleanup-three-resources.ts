/** Releases acquired resources in reverse order, even when individual cleanup fails. */
export function cleanupThreeResources(cleanups: (() => void)[]): void {
  const errors = runCleanups(cleanups);

  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Three resource cleanup failed.');
  }
}

/** Preserves the original setup failure alongside any rollback failures. */
export function failThreeSetup(cause: unknown, cleanups: (() => void)[]): never {
  const errors = runCleanups(cleanups);

  if (errors.length === 0) {
    throw cause;
  }
  throw new AggregateError([cause, ...errors], 'Three setup and cleanup failed.', { cause });
}

/**
 * Executes and removes cleanup callbacks in reverse order, returning any errors.
 * Every callback runs even if an earlier one throws. Pop before execution so
 * repeated cleanup never retries a callback that has already been attempted.
 */
function runCleanups(cleanups: (() => void)[]): unknown[] {
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
