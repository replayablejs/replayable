// @vitest-environment happy-dom
import { Container, EventBoundary, FederatedPointerEvent } from 'pixi.js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { installHintInteraction } from '../src/features/hint/install-hint-interaction.js';

const runtime = vi.hoisted(() => ({ container: undefined as HTMLElement | undefined }));
vi.mock('@replayablejs/runtime', () => ({
  playable: {
    get container() {
      return runtime.container;
    },
    screen: { orientation: 'portrait' },
    on: () => () => {},
  },
}));

let root: Container;
let input: HTMLDivElement;
let remove: (() => void) | undefined;
const begin = vi.fn<() => void>();
const end = vi.fn<() => void>();

beforeEach(() => {
  root = new Container();
  input = document.createElement('div');
  runtime.container = input;
  begin.mockClear();
  end.mockClear();
});
afterEach(() => {
  remove?.();
  root.destroy();
  vi.unstubAllGlobals();
});

function press(pointerId: number): void {
  const event = new FederatedPointerEvent(new EventBoundary(root));
  event.pointerId = pointerId;
  root.emit('pointerdowncapture', event);
}

it('resumes hints after a native cancellation without a Pixi release', () => {
  remove = installHintInteraction(root, begin, end);
  press(7);
  input.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7 }));
  expect(begin).toHaveBeenCalledOnce();
  expect(end).toHaveBeenCalledOnce();
});

it('keeps hints suspended until every finger ends and ignores unrelated cancellations', () => {
  remove = installHintInteraction(root, begin, end);
  press(7);
  press(8);
  input.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 99 }));
  input.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7 }));
  expect(end).not.toHaveBeenCalled();
  const event = new FederatedPointerEvent(new EventBoundary(root));
  event.pointerId = 8;
  root.emit('pointerupoutside', event);
  input.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 8 }));
  expect(end).toHaveBeenCalledOnce();
});

it('removes native cancellation listeners during teardown', () => {
  remove = installHintInteraction(root, begin, end);
  press(7);
  remove();
  input.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7 }));
  expect(end).not.toHaveBeenCalled();
});

it('uses touch identifiers when pointer events are unavailable', () => {
  vi.stubGlobal('PointerEvent', undefined);
  remove = installHintInteraction(root, begin, end);
  press(4);
  press(9);
  const cancel = (identifier: number) => {
    const event = new Event('touchcancel');
    Object.defineProperty(event, 'changedTouches', { value: [{ identifier }] });
    input.dispatchEvent(event);
  };
  cancel(4);
  expect(end).not.toHaveBeenCalled();
  cancel(9);
  expect(end).toHaveBeenCalledOnce();
  cancel(9);
  expect(end).toHaveBeenCalledOnce();
});
