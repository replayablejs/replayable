// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { createSoundControl } from '../src/create-sound-control.js';
import { createSoundControl as createDisabledControl } from '../src/sound-control/disabled.js';
import type { SoundControl } from '../src/types/sound-control.js';

const runtime = vi.hoisted(() => ({
  enabled: true,
  audio: true,
  ready: true,
  visible: true,
  muted: false,
  listeners: new Map<string, Set<() => void>>(),
}));

vi.mock('@replayablejs/runtime', () => ({
  playable: {
    get config() {
      return { audio: runtime.audio, devtools: { soundControl: runtime.enabled } };
    },
    get state() {
      if (!runtime.ready) {
        throw new Error('Await ready');
      }
      return { visible: runtime.visible };
    },
    audio: {
      get muted() {
        return runtime.muted;
      },
      setMuted(muted: boolean) {
        runtime.muted = muted;
      },
    },
    on(event: string, listener: () => void) {
      const listeners = runtime.listeners.get(event) ?? new Set();
      runtime.listeners.set(event, listeners);
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  },
}));

let control: SoundControl | undefined;
beforeEach(() => {
  runtime.enabled = true;
  runtime.audio = true;
  runtime.ready = true;
  runtime.visible = true;
  runtime.muted = false;
});
afterEach(() => {
  control?.destroy();
  control = undefined;
  runtime.listeners.clear();
  document.body.replaceChildren();
});

it('does nothing when disabled or audio is excluded, even before readiness', () => {
  runtime.ready = false;
  runtime.enabled = false;
  control = createSoundControl();
  control.destroy();
  runtime.enabled = true;
  runtime.audio = false;
  control = createSoundControl();
  createDisabledControl().destroy();
  expect(document.querySelector('.replayable-sound')).toBeNull();
  expect(runtime.listeners.size).toBe(0);
});

it('requires readiness before allocating DOM', () => {
  runtime.ready = false;
  expect(createSoundControl).toThrow('Await ready');
  expect(document.querySelector('.replayable-sound')).toBeNull();
});

it('toggles runtime mute synchronously and updates the existing icon', () => {
  runtime.muted = true;
  control = createSoundControl();
  const button = document.querySelector<HTMLButtonElement>('.replayable-sound')!;
  const image = button.querySelector('img')!;
  expect(button.getAttribute('aria-label')).toBe('Unmute sound');
  expect(image.src).toContain('sound-off');
  button.click();
  expect(runtime.muted).toBe(false);
  expect(button.getAttribute('aria-pressed')).toBe('false');
  expect(image.src).toContain('sound-on');
  runtime.muted = true;
  for (const listener of runtime.listeners.get('audiochange')!) {
    listener();
  }
  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(button.querySelector('img')).toBe(image);
});

it('isolates input from gameplay and only toggles once per tap', () => {
  control = createSoundControl();
  const button = document.querySelector<HTMLButtonElement>('.replayable-sound')!;
  const gameplay = vi.fn<() => void>();
  document.addEventListener('pointerdown', gameplay, true);
  document.addEventListener('click', gameplay, true);
  button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  expect(runtime.muted).toBe(false);
  button.click();
  expect(runtime.muted).toBe(true);
  expect(gameplay).not.toHaveBeenCalled();
  document.removeEventListener('pointerdown', gameplay, true);
  document.removeEventListener('click', gameplay, true);
});

it('hides with the playable, survives completion, and releases all resources', () => {
  const styleCount = document.head.querySelectorAll('style').length;
  control = createSoundControl();
  const button = document.querySelector<HTMLButtonElement>('.replayable-sound')!;
  expect(runtime.listeners.has('complete')).toBe(false);
  runtime.visible = false;
  for (const listener of runtime.listeners.get('visibilitychange')!) {
    listener();
  }
  expect(button.hidden).toBe(true);
  button.click();
  expect(runtime.muted).toBe(false);
  runtime.visible = true;
  for (const listener of runtime.listeners.get('visibilitychange')!) {
    listener();
  }
  expect(button.hidden).toBe(false);
  control.destroy();
  control.destroy();
  expect(button.isConnected).toBe(false);
  expect(document.head.querySelectorAll('style').length).toBe(styleCount);
  for (const listeners of runtime.listeners.values()) {
    expect(listeners.size).toBe(0);
  }
  button.click();
  expect(runtime.muted).toBe(false);
});
