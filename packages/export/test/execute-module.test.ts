import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { executeModule } from '../src/browser/execute-module.js';

afterEach(() => vi.restoreAllMocks());
const revoke = vi.fn<(url: string) => void>();
beforeEach(() => revoke.mockClear());

/** Node cannot import Blob URLs; a data URL exercises the same native evaluation promise. */
function useModuleSource(source: string): string {
  const url = `data:text/javascript,${encodeURIComponent(source)}#${crypto.randomUUID()}`;
  vi.spyOn(URL, 'createObjectURL').mockReturnValue(url);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke);
  return url;
}

it('awaits top-level work and releases the source URL', async () => {
  const source = 'await Promise.resolve(); export const ready = true;';
  const url = useModuleSource(source);
  await expect(executeModule(source, 'assets')).resolves.toBeUndefined();
  expect(revoke).toHaveBeenCalledExactlyOnceWith(url);
});

it.each([
  'throw new Error("evaluation failed");',
  'await Promise.reject(new Error("await failed"));',
  'const = ;',
])('rejects module failure and releases its URL: %s', async (source) => {
  const url = useModuleSource(source);
  await expect(executeModule(source, 'application')).rejects.toMatchObject({
    message: 'Failed to execute compressed Replayable application entry.',
    cause: expect.any(Error),
  });
  expect(revoke).toHaveBeenCalledExactlyOnceWith(url);
});
