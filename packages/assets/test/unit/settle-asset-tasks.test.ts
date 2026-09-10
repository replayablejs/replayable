import { describe, expect, it } from 'vitest';

import { settleAssetTasks } from '#pipeline/settle-asset-tasks.js';

describe('settling asset tasks', () => {
  it('does not reject while another writer is still running', async () => {
    const writer = Promise.withResolvers<string>();
    const failure = new Error('encoding failed');
    let settled = false;
    const result = settleAssetTasks([Promise.reject(failure), writer.promise]);
    const observed = result.catch((error: unknown) => {
      settled = true;
      return error;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    writer.resolve('finished');
    expect(await observed).toBe(failure);
  });

  it('preserves result order and every failure', async () => {
    expect(await settleAssetTasks([Promise.resolve('a'), Promise.resolve('b')])).toEqual([
      'a',
      'b',
    ]);
    const first = new Error('first');
    const second = new Error('second');
    await expect(
      settleAssetTasks([Promise.reject(first), Promise.reject(second)]),
    ).rejects.toMatchObject({ errors: [first, second] });
  });
});
