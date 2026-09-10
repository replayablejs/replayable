// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createEndCardTrigger } from '../src/create-end-card-trigger.js';
import { createEndCardTrigger as createDisabledTrigger } from '../src/endcard-trigger/disabled.js';
import type { EndCardTrigger } from '../src/types/end-card-trigger.js';

const runtime = vi.hoisted(() => ({
  enabled: true,
  ready: true,
  visible: true,
  completed: false,
  completions: new Set<() => void>(),
  complete: vi.fn<(reason: string) => void>(),
}));

vi.mock('@replayablejs/runtime', () => ({
  playable: {
    get config() {
      return { devtools: { endCardTrigger: runtime.enabled } };
    },
    get state() {
      if (!runtime.ready) {
        throw new Error('Await ready');
      }
      return {
        visible: runtime.visible,
        completion: runtime.completed ? { reason: 'skip' } : undefined,
      };
    },
    complete: runtime.complete,
    on(_event: string, listener: () => void) {
      runtime.completions.add(listener);
      return () => runtime.completions.delete(listener);
    },
  },
}));

let trigger: EndCardTrigger | undefined;
beforeEach(() => {
  runtime.enabled = true;
  runtime.ready = true;
  runtime.visible = true;
  runtime.completed = false;
  runtime.complete.mockReset().mockImplementation(() => {
    runtime.completed = true;
    for (const listener of runtime.completions) {
      listener();
    }
  });
});
afterEach(() => {
  trigger?.destroy();
  trigger = undefined;
  runtime.completions.clear();
  document.body.replaceChildren();
});

it('does nothing when disabled, including before readiness', () => {
  runtime.enabled = false;
  runtime.ready = false;
  trigger = createEndCardTrigger();
  createDisabledTrigger().destroy();
  expect(document.querySelector('.replayable-skip')).toBeNull();
  expect(runtime.completions.size).toBe(0);
});

it('requires readiness and does not allocate UI after completion', () => {
  runtime.ready = false;
  expect(() => createEndCardTrigger()).toThrow('Await ready');
  expect(document.querySelector('.replayable-skip')).toBeNull();
  runtime.ready = true;
  runtime.completed = true;
  trigger = createEndCardTrigger();
  expect(document.querySelector('.replayable-skip')).toBeNull();
});

it('skips once using Escape and removes its DOM, styles, and listeners on completion', () => {
  const styleCount = document.head.querySelectorAll('style').length;
  trigger = createEndCardTrigger();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(runtime.complete).toHaveBeenCalledExactlyOnceWith('skip');
  expect(document.querySelector('.replayable-skip')).toBeNull();
  expect(document.head.querySelectorAll('style').length).toBe(styleCount);
  expect(runtime.completions.size).toBe(0);
});

it('isolates button pointer input before document capture and completes on click only', () => {
  trigger = createEndCardTrigger();
  const button = document.querySelector<HTMLButtonElement>('.replayable-skip')!;
  const gameplay = vi.fn<() => void>();
  document.addEventListener('pointerdown', gameplay, true);
  button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  expect(gameplay).not.toHaveBeenCalled();
  expect(runtime.complete).not.toHaveBeenCalled();
  button.click();
  expect(runtime.complete).toHaveBeenCalledExactlyOnceWith('skip');
  document.removeEventListener('pointerdown', gameplay, true);
});

it('ignores repeated keys, editable targets, and hidden playables', () => {
  trigger = createEndCardTrigger();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', repeat: true }));
  const input = document.createElement('input');
  document.body.append(input);
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  runtime.visible = false;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(runtime.complete).not.toHaveBeenCalled();
});

it('handles Escape while its button is focused and allows explicit repeated cleanup', () => {
  trigger = createEndCardTrigger();
  const button = document.querySelector<HTMLButtonElement>('.replayable-skip')!;
  button.focus();
  button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  expect(runtime.complete).toHaveBeenCalledOnce();
  trigger.destroy();
  trigger.destroy();
});
