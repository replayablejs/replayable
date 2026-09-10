// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';

import type { StatsView } from '../src/types/presentation.js';
import type { StatsSample } from '../src/types/sampling.js';
import { createTestView } from './fixtures/create-test-view.js';

const config = {
  display: 'compact' as const,
  fps: true,
  frameInterval: true,
  jsHeap: true,
  drawCalls: false,
  textureBinds: false,
  programUses: false,
};
const sample: StatsSample = new Map([
  ['fps', { value: 60, graphValue: 60, range: { min: 60, max: 60 } }],
  ['frameInterval', { value: 16, graphValue: 20, range: { min: 12, max: 20 } }],
  ['jsHeap', { value: 12, graphValue: 12, range: { min: 12, max: 12 } }],
]);
const views: StatsView[] = [];
const cleanups: (() => void)[] = [];

afterEach(() => {
  for (const view of views.splice(0)) {
    view.destroy();
  }
  for (const cleanup of cleanups.splice(0)) {
    cleanup();
  }
  vi.restoreAllMocks();
});

function start(options = config): StatsView {
  const view = createTestView(options);
  views.push(view);
  return view;
}

function shell(): HTMLElement {
  const element = document.querySelector('.replayable-stats');
  if (!(element instanceof HTMLElement)) {
    throw new Error('Missing stats shell');
  }
  return element;
}

function visibleLabels(): (string | null)[] {
  return [...document.querySelectorAll('.replayable-stats__card:not([hidden])')].map((card) =>
    card.getAttribute('data-label'),
  );
}

it('does not install compact input listeners for expanded presentation', () => {
  const add = vi.spyOn(window, 'addEventListener');
  const view = createTestView({ ...config, display: 'expanded' });
  views.push(view);
  expect(add).not.toHaveBeenCalled();
  expect(shell().hasAttribute('role')).toBe(false);
});

it('removes every capture listener using the original callback and capture flag', () => {
  const add = vi.spyOn(window, 'addEventListener');
  const remove = vi.spyOn(window, 'removeEventListener');
  const view = start();
  const registrations = [...add.mock.calls];
  expect(registrations.length).toBeGreaterThan(0);
  view.destroy();
  for (const [type, listener] of registrations) {
    expect(remove).toHaveBeenCalledWith(type, listener, true);
  }
});

it('does not bridge heap reporting gaps and safely handles a single enabled card', () => {
  const view = start({ ...config, fps: false, frameInterval: false });
  view.update(sample);
  view.update(sample);
  expect(shell().querySelector('path[d]')).not.toBeNull();
  shell().click();
  expect(visibleLabels()).toEqual(['JS heap · MB']);
  view.update(new Map(sample).set('jsHeap', undefined));
  expect(visibleLabels()).toEqual([]);
  expect(shell().hasAttribute('role')).toBe(false);
  view.update(sample);
  expect(visibleLabels()).toEqual(['JS heap · MB']);
  expect(shell().querySelector('path[d]')).toBeNull();
});

it('cycles once for keyboard activation, not again on repeats or keyup', () => {
  const view = start();
  view.update(sample);
  shell().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  expect(visibleLabels()).toEqual(['Frame · ms']);
  shell().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }));
  shell().dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
  expect(visibleLabels()).toEqual(['Frame · ms']);
});

it('cycles enabled supported cards in order and preserves selection across hide/show', () => {
  const view = start();
  expect(visibleLabels()).toEqual(['FPS']);
  view.update(sample);
  shell().click();
  expect(visibleLabels()).toEqual(['Frame · ms']);
  view.hide();
  shell().click();
  view.show();
  expect(visibleLabels()).toEqual(['Frame · ms']);
  shell().click();
  expect(visibleLabels()).toEqual(['JS heap · MB']);
  shell().click();
  expect(visibleLabels()).toEqual(['FPS']);
});

it('skips disabled or unavailable cards and removes an empty interaction target', () => {
  const view = start({ ...config, fps: false });
  shell().click();
  expect(visibleLabels()).toEqual(['Frame · ms']);
  view.update(sample);
  shell().click();
  expect(visibleLabels()).toEqual(['JS heap · MB']);
  view.update(new Map(sample).set('jsHeap', undefined));
  expect(visibleLabels()).toEqual(['Frame · ms']);
  view.destroy();
  const heapOnly = start({ ...config, fps: false, frameInterval: false });
  expect(visibleLabels()).toEqual([]);
  expect(shell().hasAttribute('role')).toBe(false);
  expect(shell().hasAttribute('tabindex')).toBe(false);
  heapOnly.update(sample);
  expect(visibleLabels()).toEqual(['JS heap · MB']);
  expect(shell().getAttribute('role')).toBe('button');
});

it('collects hidden history and retains old peaks without redrawing hidden paths', () => {
  const view = start();
  view.update(
    new Map(sample).set('frameInterval', {
      value: 20,
      graphValue: 500,
      range: { min: 12, max: 500 },
    }),
  );
  for (let index = 0; index < 61; index += 1) {
    view.update(sample);
  }
  const frame = document.querySelector('[data-label="Frame · ms"]');
  expect(frame?.querySelector('path')?.hasAttribute('d')).toBe(false);
  expect(frame?.querySelector('text')).toBeNull();
  shell().click();
  const path = frame?.querySelector('.replayable-stats__graph-line')?.getAttribute('d');
  // The old 500 ms peak still sets an internal 800 ms scale, even though it has
  // left the history. A 20 ms sample therefore sits at y=52.7, not y=43.6.
  expect(path).toMatch(/^M2,52\.7L/);
  expect(path?.match(/L/g)).toHaveLength(59);
  shell().click();
  shell().click();
  shell().click();
  expect(frame?.querySelector('.replayable-stats__graph-line')?.getAttribute('d')).toBe(path);
});

it('intercepts before existing document capture listeners, without blocking gameplay elsewhere', () => {
  const activity = vi.fn<(event: Event) => void>();
  const types = ['pointerdown', 'mousedown', 'touchstart', 'click', 'keydown'];
  for (const type of types) {
    document.addEventListener(type, activity, true);
  }
  cleanups.push(() => {
    for (const type of types) {
      document.removeEventListener(type, activity, true);
    }
  });
  const view = start();
  const target = shell().querySelector('.replayable-stats__value');
  if (target === null) {
    throw new Error('Missing card value');
  }
  for (const type of types.slice(0, 3)) {
    const input = new Event(type, { bubbles: true, cancelable: true, composed: true });
    target.dispatchEvent(input);
    expect(input.defaultPrevented).toBe(false); // Preserve the browser's eventual tap click.
  }
  expect(visibleLabels()).toEqual(['FPS']);
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  expect(visibleLabels()).toEqual(['Frame · ms']);
  shell().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  expect(activity).not.toHaveBeenCalled();
  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  expect(activity).toHaveBeenCalledTimes(1);

  // Reattach the old node after destruction to prove interception was removed.
  const oldShell = shell();
  view.destroy();
  document.body.append(oldShell);
  cleanups.push(() => oldShell.remove());
  oldShell.click();
  expect(activity).toHaveBeenCalledTimes(2);
});
