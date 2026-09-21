import { expect, it, vi } from 'vitest';

import { createUpdateChannel } from '../src/update/create-update-channel.js';

it('skips a listener removed before its turn in the current dispatch', () => {
  const channel = createUpdateChannel<number>(() => {});
  const pending = vi.fn<(value: number) => void>();
  channel.add(() => removePending());
  const removePending = channel.add(pending);
  channel.dispatch(1);
  channel.dispatch(2);
  expect(pending).not.toHaveBeenCalled();
});

it('defers additions and does not revive a removed registration when re-added', () => {
  const channel = createUpdateChannel<number>(() => {});
  const pending = vi.fn<(value: number) => void>();
  const added = vi.fn<(value: number) => void>();
  const removeFirst = channel.add(() => {
    removeFirst();
    removePending();
    channel.add(pending);
    channel.add(added);
  });
  const removePending = channel.add(pending);
  channel.dispatch(1);
  expect(pending).not.toHaveBeenCalled();
  expect(added).not.toHaveBeenCalled();
  channel.dispatch(2);
  expect(pending.mock.calls).toEqual([[2]]);
  expect(added.mock.calls).toEqual([[2]]);
  removePending();
  channel.dispatch(3);
  expect(pending.mock.calls).toEqual([[2], [3]]);
});

it('finishes the current callback after self-removal and preserves remaining order', () => {
  const channel = createUpdateChannel<number>(() => {});
  const calls: string[] = [];
  const remove = channel.add(() => {
    calls.push('first');
    remove();
    calls.push('finished');
  });
  channel.add(() => calls.push('second'));
  channel.dispatch(1);
  channel.dispatch(2);
  expect(calls).toEqual(['first', 'finished', 'second', 'second']);
});

it('keeps duplicate registration and removal idempotent with activity boundaries', () => {
  const activity = vi.fn<() => void>();
  const channel = createUpdateChannel<number>(activity);
  const listener = vi.fn<(value: number) => void>();
  const remove = channel.add(listener);
  const removeDuplicate = channel.add(listener);
  removeDuplicate();
  channel.dispatch(1);
  expect(listener).toHaveBeenCalledExactlyOnceWith(1);
  expect(activity).toHaveBeenCalledTimes(1);
  remove();
  remove();
  expect(channel.hasListeners()).toBe(false);
  expect(activity).toHaveBeenCalledTimes(2);
});
