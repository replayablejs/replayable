import { cancelFrame, frame, frameSteps, type FrameData } from 'motion';
import { afterEach, expect, it, vi } from 'vitest';

import type { PostRenderContext } from '../src/types/update.js';
import { createRuntimeUpdates } from '../src/update/create-runtime-updates.js';

const cleanup: (() => void)[] = [];
afterEach(() => {
  for (const stop of cleanup.reverse()) {
    stop();
  }
  cleanup.length = 0;
});

/** Process real Motion phases without introducing a second RAF or a mock scheduler. */
function processFrame(timestamp: number): void {
  const data: FrameData = { timestamp, delta: 16, isProcessing: true };
  frameSteps.update.process(data);
  frameSteps.render.process(data);
  frameSteps.postRender.process(data);
}

function createUpdates() {
  const updates = createRuntimeUpdates();
  cleanup.push(() => updates.setVisible(false));
  return updates;
}

it('runs post-render-only demand after readiness and visibility, with shared timestamps', () => {
  const updates = createUpdates();
  const listener = vi.fn<(context: PostRenderContext) => void>();
  const remove = updates.postRender.add(listener);
  processFrame(0);
  updates.markReady();
  processFrame(16);
  expect(listener).not.toHaveBeenCalled();
  updates.setVisible(true);
  processFrame(32);
  processFrame(48);
  expect(listener.mock.calls).toEqual([[{ timestamp: 32 }], [{ timestamp: 48 }]]);
  remove();
  processFrame(64);
  expect(listener).toHaveBeenCalledTimes(2);
});

it('dispatches after update listeners and Motion render work regardless of subscription order', () => {
  const updates = createUpdates();
  const order: string[] = [];
  updates.postRender.add(() => order.push('postRender'));
  updates.update.add(() => order.push('update'));
  const render = (): void => {
    order.push('render');
  };
  frame.render(render);
  cleanup.push(() => cancelFrame(render));
  updates.setVisible(true);
  updates.markReady();
  processFrame(100);
  expect(order).toEqual(['update', 'render', 'postRender']);
});

it('cancels an already queued post-render callback when hidden during rendering', () => {
  const updates = createUpdates();
  const listener = vi.fn<(context: PostRenderContext) => void>();
  updates.postRender.add(listener);
  updates.markReady();
  updates.setVisible(true);
  const hide = (): void => updates.setVisible(false);
  frame.render(hide);
  cleanup.push(() => cancelFrame(hide));
  processFrame(100);
  expect(listener).not.toHaveBeenCalled();
  updates.setVisible(true);
  processFrame(1000);
  expect(listener).toHaveBeenCalledExactlyOnceWith({ timestamp: 1000 });
});

it('invalidates callbacks retained in a postRender snapshot even after stop and restart', () => {
  const updates = createUpdates();
  const listener = vi.fn<(context: PostRenderContext) => void>();
  updates.postRender.add(listener);
  updates.markReady();
  updates.setVisible(true);
  const restart = (): void => {
    updates.setVisible(false);
    updates.setVisible(true);
  };
  frame.postRender(restart);
  cleanup.push(() => cancelFrame(restart));
  processFrame(100);
  expect(listener).not.toHaveBeenCalled();
  processFrame(116);
  expect(listener).toHaveBeenCalledExactlyOnceWith({ timestamp: 116 });
});

it('preserves update-channel snapshot semantics and stops when the last listener unsubscribes', () => {
  const updates = createUpdates();
  const second = vi.fn<(context: PostRenderContext) => void>();
  let removeSecond = (): void => {};
  const removeFirst = updates.postRender.add(() => removeSecond());
  removeSecond = updates.postRender.add(second);
  updates.markReady();
  updates.setVisible(true);
  processFrame(100);
  processFrame(116);
  expect(second).toHaveBeenCalledExactlyOnceWith({ timestamp: 100 });
  removeFirst();
  processFrame(132);
  expect(second).toHaveBeenCalledTimes(1);
});
