/* eslint-disable no-underscore-dangle -- Pixi DevTools requires these exact global names. */

import { Container, WebGLRenderer } from 'pixi.js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { registerPixiDevtools } from '../src/integrations/register-pixi-devtools.js';

// The integration only publishes object identities; no WebGL initialization is needed.
vi.mock('pixi.js', () => ({
  Container: vi.fn<() => void>(),
  WebGLRenderer: vi.fn<() => void>(),
}));

beforeEach(() => vi.stubEnv('DEV', true));
afterEach(() => {
  Reflect.deleteProperty(globalThis, '__PIXI_STAGE__');
  Reflect.deleteProperty(globalThis, '__PIXI_RENDERER__');
  vi.unstubAllEnvs();
});

it('registers the development stage and renderer and removes them on cleanup', () => {
  const stage = new Container();
  const renderer = new WebGLRenderer();
  const cleanup = registerPixiDevtools(stage, renderer);
  expect(globalThis.__PIXI_STAGE__).toBe(stage);
  expect(globalThis.__PIXI_RENDERER__).toBe(renderer);
  cleanup();
  cleanup();
  expect(Object.hasOwn(globalThis, '__PIXI_STAGE__')).toBe(false);
  expect(Object.hasOwn(globalThis, '__PIXI_RENDERER__')).toBe(false);
});

it('does not remove a newer registration when an older instance is destroyed', () => {
  const cleanupOld = registerPixiDevtools(new Container(), new WebGLRenderer());
  const stage = new Container();
  const renderer = new WebGLRenderer();
  const cleanupNew = registerPixiDevtools(stage, renderer);
  cleanupOld();
  expect(globalThis.__PIXI_STAGE__).toBe(stage);
  expect(globalThis.__PIXI_RENDERER__).toBe(renderer);
  cleanupNew();
});

it('checks ownership of each global independently', () => {
  const cleanup = registerPixiDevtools(new Container(), new WebGLRenderer());
  const newerRenderer = new WebGLRenderer();
  globalThis.__PIXI_RENDERER__ = newerRenderer;
  cleanup();
  expect(globalThis.__PIXI_STAGE__).toBeUndefined();
  expect(globalThis.__PIXI_RENDERER__).toBe(newerRenderer);
});

it('does not publish or clear globals in production', () => {
  const stage = new Container();
  const renderer = new WebGLRenderer();
  globalThis.__PIXI_STAGE__ = stage;
  globalThis.__PIXI_RENDERER__ = renderer;
  vi.stubEnv('DEV', false);
  const cleanup = registerPixiDevtools(new Container(), new WebGLRenderer());
  cleanup();
  expect(globalThis.__PIXI_STAGE__).toBe(stage);
  expect(globalThis.__PIXI_RENDERER__).toBe(renderer);
});
