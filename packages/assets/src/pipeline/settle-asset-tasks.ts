/**
 * Waits for every started task before reporting a processing failure.
 * Promise.all rejects early: other encoders could still write after rollback
 * starts. Each concurrent writing layer must settle its own children first.
 * Results retain input order, and a single failure retains its original error.
 */
export async function settleAssetTasks<Value>(tasks: readonly Promise<Value>[]): Promise<Value[]> {
  const results = await Promise.allSettled(tasks);
  const values: Value[] = [];
  const errors: unknown[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      values.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Multiple asset tasks failed.');
  }
  return values;
}
